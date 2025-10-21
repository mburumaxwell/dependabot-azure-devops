import {
  HEADER_NAME_AUTHORIZATION,
  HttpRequestError,
  type InnerApiClient,
  type InnerRequestOptions,
  isErrorTemporaryFailure,
  type ResourceResponse,
} from '@/core';
import {
  type DependabotCredential,
  DependabotCredentialSchema,
  type DependabotJobConfig,
  DependabotJobConfigSchema,
} from './job';
import { logger } from './logger';
import type { JobParameters } from './params';
import type { DependabotMetric, DependabotRecordUpdateJobError } from './update';

export class JobDetailsFetchingError extends Error {}
export class CredentialFetchingError extends Error {}
export type SecretMasker = (value: string) => void;

export class ApiClient {
  private jobToken: string;
  constructor(
    private readonly client: InnerApiClient,
    readonly params: JobParameters,
    jobToken: string,
    private readonly credentialsToken: string,
    private readonly secretMasker: SecretMasker,
  ) {
    this.jobToken = jobToken;
  }

  // We use a static unknown SHA when marking a job as complete from the action
  // to remain in parity with the existing runner.
  UnknownSha = {
    'base-commit-sha': 'unknown',
  };

  // Getter for jobToken
  getJobToken(): string {
    return this.jobToken;
  }

  async getJobDetails(): Promise<DependabotJobConfig> {
    try {
      const res = await this.getWithRetry<DependabotJobConfig>(
        `/update_jobs/${this.params.jobId}/details`,
        this.jobToken,
        { schema: DependabotJobConfigSchema },
      );
      if (res.status !== 200) {
        throw new JobDetailsFetchingError(
          `fetching job details: unexpected status code: ${res.status}: ${JSON.stringify(res.error)}`,
        );
      }
      if (!res.data) {
        throw new JobDetailsFetchingError(`fetching job details: missing response`);
      }

      return res.data;
    } catch (error) {
      if (error instanceof JobDetailsFetchingError) {
        throw error;
      } else if (error instanceof HttpRequestError) {
        throw new JobDetailsFetchingError(
          `fetching job details: unexpected status code: ${error.code}: ${error.message}`,
        );
      } else if (error instanceof Error) {
        throw new JobDetailsFetchingError(`fetching job details: ${error.name}: ${error.message}`);
      }
      throw error;
    }
  }

  async getCredentials(): Promise<DependabotCredential[]> {
    try {
      const res = await this.getWithRetry<DependabotCredential[]>(
        `/update_jobs/${this.params.jobId}/credentials`,
        this.credentialsToken,
        { schema: DependabotCredentialSchema.array() },
      );

      if (res.status !== 200) {
        throw new CredentialFetchingError(
          `fetching credentials: unexpected status code: ${res.status}: ${JSON.stringify(res.error)}`,
        );
      }
      if (!res.data) {
        throw new CredentialFetchingError(`fetching credentials: missing response`);
      }

      // Mask any secrets we've just retrieved from environment logs
      for (const credential of res.data) {
        if (credential.password) {
          this.secretMasker(credential.password);
        }
        if (credential.token) {
          this.secretMasker(credential.token);
        }
        if (credential['auth-key']) {
          this.secretMasker(credential['auth-key']);
        }
      }

      return res.data;
    } catch (error: unknown) {
      if (error instanceof CredentialFetchingError) {
        throw error;
      } else if (error instanceof HttpRequestError) {
        throw new CredentialFetchingError(
          `fetching credentials: unexpected status code: ${error.code}: ${error.message}`,
        );
      } else if (error instanceof Error) {
        throw new CredentialFetchingError(`fetching credentials: ${error.name}: ${error.message}`);
      }
      throw error;
    }
  }

  async reportJobError(error: DependabotRecordUpdateJobError): Promise<void> {
    const res = await this.client.post(`/update_jobs/${this.params.jobId}/record_update_job_error`, {
      payload: error,
      headers: {
        [HEADER_NAME_AUTHORIZATION]: this.jobToken,
      },
    });
    if (res.status !== 204) {
      throw new Error(`Unexpected status code: ${res.status}`);
    }
  }

  async markJobAsProcessed(): Promise<void> {
    const res = await this.client.patch(`/update_jobs/${this.params.jobId}/mark_as_processed`, {
      payload: this.UnknownSha,
      headers: {
        [HEADER_NAME_AUTHORIZATION]: this.jobToken,
      },
    });
    if (res.status !== 204) {
      throw new Error(`Unexpected status code: ${res.status}`);
    }
  }

  async sendMetrics(
    name: string,
    metricType: 'increment' | 'gauge',
    value: number,
    additionalTags: Record<string, string> = {},
  ): Promise<void> {
    try {
      await this.reportMetrics([
        {
          metric: `dependabot.action.${name}`,
          type: metricType,
          value,
          tags: additionalTags,
        },
      ]);
      logger.info(`Successfully sent metric (dependabot.action.${name}) to remote API endpoint`);
    } catch (error) {
      // metrics should typically not cause critical path failure so we log the
      // failure and continue with the job
      logger.warn(`Metrics reporting failed: ${(error as Error).message}`);
    }
  }

  async reportMetrics(metrics: DependabotMetric[]): Promise<void> {
    const res = await this.client.post(`/update_jobs/${this.params.jobId}/record_metrics`, {
      payload: { data: metrics },
      headers: {
        [HEADER_NAME_AUTHORIZATION]: this.jobToken,
      },
    });

    if (res.status !== 204) {
      throw new Error(`Unexpected status code: ${res.status}`);
    }
  }

  private async getWithRetry<T>(
    url: string,
    token: string,
    options?: Omit<InnerRequestOptions<T>, 'headers'>,
  ): Promise<ResourceResponse<T>> {
    let attempt = 1;
    const delayMs = 1000 * 2 ** attempt;

    const execute = async (): Promise<ResourceResponse<T>> => {
      try {
        const res = await this.client.get<T>(url, {
          headers: { Authorization: token },
          ...options,
        });

        // Check that the request was successful
        const { status, statusText } = res;
        if (status < 200 || status > 299) {
          throw new HttpRequestError(`HTTP GET '${url}' failed: ${status} ${statusText}`, status);
        }

        return res;
      } catch (e) {
        const error = e as Error;

        if (isErrorTemporaryFailure(error)) {
          if (attempt >= 3) throw error;
          logger.warn(`Retrying failed request in ${delayMs}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));

          attempt++;
          return execute();
        }
        throw error;
      }
    };

    return execute();
  }
}
