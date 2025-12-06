import type {
  DependabotCredential,
  DependabotJobConfig,
  DependabotMetric,
  DependabotRecordUpdateJobError,
} from '@paklo/core/dependabot';
import { logger } from '@paklo/core/logger';
import { isHTTPError, type KyInstance, type KyResponse } from 'ky';
import type { JobParameters } from './params';

export class JobDetailsFetchingError extends Error {}
export class CredentialFetchingError extends Error {}
export type SecretMasker = (value: string) => void;

export class ApiClient {
  private dependabotApiUrl: string;
  private jobToken: string;
  constructor(
    private readonly client: KyInstance,
    readonly params: JobParameters,
    jobToken: string,
    private readonly credentialsToken: string,
    private readonly secretMasker: SecretMasker,
  ) {
    // if dependabotApiUrl contains "host.docker.internal", we need to replace it with "localhost" for local calls
    const baseUrl = params.dependabotApiUrl.replace('host.docker.internal', 'localhost');
    this.dependabotApiUrl = baseUrl;
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
    const detailsURL = `${this.dependabotApiUrl}/update_jobs/${this.params.jobId}/details`;
    try {
      const res = await this.getWithRetry<DependabotJobConfig>(detailsURL, this.jobToken);
      if (res.status !== 200) {
        throw new JobDetailsFetchingError(
          `fetching job details: unexpected status code: ${res.status}: ${JSON.stringify(await res.json())}`,
        );
      }
      const data = await res.json();
      if (!data) {
        throw new JobDetailsFetchingError(`fetching job details: missing response`);
      }

      return data;
    } catch (error) {
      if (error instanceof JobDetailsFetchingError) {
        throw error;
      } else if (isHTTPError(error)) {
        throw new JobDetailsFetchingError(
          `fetching job details: unexpected status code: ${error.response.status}: ${error.message}`,
        );
      } else if (error instanceof Error) {
        throw new JobDetailsFetchingError(`fetching job details: ${error.name}: ${error.message}`);
      }
      throw error;
    }
  }

  async getCredentials(): Promise<DependabotCredential[]> {
    const credentialsURL = `${this.dependabotApiUrl}/update_jobs/${this.params.jobId}/credentials`;
    try {
      const res = await this.getWithRetry<DependabotCredential[]>(credentialsURL, this.credentialsToken);

      if (res.status !== 200) {
        throw new CredentialFetchingError(
          `fetching credentials: unexpected status code: ${res.status}: ${JSON.stringify(await res.json())}`,
        );
      }
      const data = await res.json();
      if (!data) {
        throw new CredentialFetchingError(`fetching credentials: missing response`);
      }

      // Mask any secrets we've just retrieved from environment logs
      for (const credential of data) {
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

      return data;
    } catch (error: unknown) {
      if (error instanceof CredentialFetchingError) {
        throw error;
      } else if (isHTTPError(error)) {
        throw new CredentialFetchingError(
          `fetching credentials: unexpected status code: ${error.response.status}: ${error.message}`,
        );
      } else if (error instanceof Error) {
        throw new CredentialFetchingError(`fetching credentials: ${error.name}: ${error.message}`);
      }
      throw error;
    }
  }

  async reportJobError(error: DependabotRecordUpdateJobError): Promise<void> {
    const recordErrorURL = `${this.dependabotApiUrl}/update_jobs/${this.params.jobId}/record_update_job_error`;
    const res = await this.client.post(recordErrorURL, {
      json: error,
      headers: { Authorization: this.jobToken },
    });
    if (res.status !== 204) {
      throw new Error(`Unexpected status code: ${res.status}`);
    }
  }

  async markJobAsProcessed(): Promise<void> {
    const markAsProcessedURL = `${this.dependabotApiUrl}/update_jobs/${this.params.jobId}/mark_as_processed`;
    const res = await this.client.patch(markAsProcessedURL, {
      json: this.UnknownSha,
      headers: { Authorization: this.jobToken },
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
    const metricsURL = `${this.dependabotApiUrl}/update_jobs/${this.params.jobId}/record_metrics`;
    const res = await this.client.post(metricsURL, {
      json: { data: metrics },
      headers: { Authorization: this.jobToken },
    });

    if (res.status !== 204) {
      throw new Error(`Unexpected status code: ${res.status}`);
    }
  }

  private async getWithRetry<T>(url: string, token: string, options?: RequestInit): Promise<KyResponse<T>> {
    const execute = async (): Promise<KyResponse<T>> => {
      const res = await this.client.get<T>(url, {
        headers: { Authorization: token },
        retry: {
          limit: 3,
          // other default options are sufficient:
          // https://github.com/sindresorhus/ky#retry
          // delay: attemptCount => 0.3 * (2 ** (attemptCount - 1)) * 1000
          // statusCodes: 408 413 429 500 502 503 504
          // afterStatusCodes: 413, 429, 503
        },
        hooks: {
          beforeRetry: [
            async ({ request, options, error, retryCount }) => {
              if (isHTTPError(error)) {
                logger.warn(`Retrying failed request with status code: ${error.response.status}`);
              }
            },
          ],
        },
        ...options,
      });

      return res;
    };

    return execute();
  }
}
