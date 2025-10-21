import crypto from 'node:crypto';
import os from 'node:os';

import { InnerApiClient } from '@/core';
import packageJson from '../../package.json';
import { ApiClient, CredentialFetchingError, type SecretMasker } from './api-client';
import { PROXY_IMAGE_NAME, updaterImageName } from './docker-tags';
import { ImageService, type MetricReporter } from './image-service';
import { logger } from './logger';
import { getJobParameters } from './params';
import { Updater } from './updater';
import type { UsageTelemetryRequestData } from './usage';

export class JobRunnerImagingError extends Error {}
export class JobRunnerUpdaterError extends Error {}

export type JobRunnerOptions = {
  dependabotApiUrl: string;
  dependabotApiDockerUrl?: string;
  jobId: number;
  jobToken: string;
  credentialsToken: string;
  updaterImage?: string;
  secretMasker: SecretMasker;
};

export class JobRunner {
  private readonly options: JobRunnerOptions;

  constructor(options: JobRunnerOptions) {
    this.options = options;
  }

  async run() {
    const { dependabotApiUrl, dependabotApiDockerUrl, jobId, jobToken, credentialsToken, secretMasker } = this.options;

    const params = getJobParameters({
      jobId,
      jobToken,
      credentialsToken,
      dependabotApiUrl,
      dependabotApiDockerUrl: dependabotApiDockerUrl ?? dependabotApiUrl,
      updaterImage: this.options.updaterImage,
    })!;

    // if dependabotApiUrl contains "host.docker.internal", we need to replace it with "localhost" for local calls
    const baseUrl = dependabotApiUrl.replace('host.docker.internal', 'localhost');
    const client = new InnerApiClient({ baseUrl });
    const apiClient = new ApiClient(client, params, jobToken, credentialsToken, secretMasker);

    // If we fail to succeed in fetching the job details, we cannot be sure the job has entered a 'processing' state,
    // so we do not try attempt to report back an exception if this fails and instead rely on the workflow run
    // webhook as it anticipates scenarios where jobs have failed while 'enqueued'.
    const job = await apiClient.getJobDetails();

    // The params can specify which updater image to use. If it doesn't, fall back to the pinned version.
    const updaterImage = params.updaterImage || updaterImageName(job['package-manager']);

    // The sendMetrics function is used to send metrics to the API client.
    // It uses the package manager as a tag to identify the metric.
    const sendMetricsWithPackageManager: MetricReporter = async (name, metricType, value, additionalTags = {}) => {
      try {
        await apiClient.sendMetrics(name, metricType, value, {
          package_manager: job['package-manager'],
          ...additionalTags,
        });
      } catch (error) {
        logger.warn(`Metric sending failed for ${name}: ${(error as Error).message}`);
      }
    };

    const credentials = (await apiClient.getCredentials()) || [];

    const updater = new Updater(updaterImage, PROXY_IMAGE_NAME, params, job, credentials);

    try {
      // Using sendMetricsWithPackageManager wrapper to inject package manager tag to
      // avoid passing additional parameters to ImageService.pull method
      await ImageService.pull(updaterImage, sendMetricsWithPackageManager);
      await ImageService.pull(PROXY_IMAGE_NAME, sendMetricsWithPackageManager);
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new JobRunnerImagingError(err.message);
      }
    }

    try {
      await updater.runUpdater();
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new JobRunnerUpdaterError(err.message);
      }
    }
  }
}

export type RunJobOptions = JobRunnerOptions & {
  usage: Pick<UsageTelemetryRequestData, 'trigger' | 'provider' | 'owner' | 'project' | 'package-manager'>;
};
export type RunJobResult = { success: true; message?: string } | { success: false; message: string };

export async function runJob({ jobId, usage, ...options }: RunJobOptions): Promise<RunJobResult> {
  const started = new Date();
  let success = false;
  let message: string | undefined;
  try {
    const runner = new JobRunner({ jobId, ...options });
    await runner.run();
    success = true;
  } catch (err) {
    if (err instanceof JobRunnerImagingError) {
      message = `Error fetching updater images: ${err.message}`;
    } else if (err instanceof JobRunnerUpdaterError) {
      message = `Error running updater: ${err.message}`;
    } else if (err instanceof CredentialFetchingError) {
      message = `Dependabot was unable to retrieve job credentials: ${err.message}`;
    } else {
      message = `Unknown error: ${(err as Error).message}`;
    }
  }

  const duration = Date.now() - started.getTime();
  const data: UsageTelemetryRequestData = {
    ...usage,
    host: {
      platform: os.platform(),
      release: os.release(),
      arch: os.arch(),
      'machine-hash': crypto.createHash('sha256').update(os.hostname()).digest('hex'),
    },
    version: packageJson.version,
    id: jobId,
    started,
    duration,
    success,
  };
  try {
    const json = JSON.stringify(data);
    logger.debug(`Usage telemetry data: ${json}`);
    const resp = await fetch('https://dashboard.paklo.app/api/usage-telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: json,
    });
    if (!resp.ok) {
      logger.debug(`Failed to send usage telemetry data: ${resp.status} ${resp.statusText}`);
    }
  } catch (err) {
    logger.debug(`Failed to send usage telemetry data: ${(err as Error).message}`);
    // ignore
  }

  logger.info(`Update job ${jobId} completed`);
  return { success, message: message! };
}
