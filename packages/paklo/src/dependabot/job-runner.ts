import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

import { InnerApiClient } from '@/core';
import { ApiClient, CredentialFetchingError, type SecretMasker } from './api-client';
import { PROXY_IMAGE_NAME, updaterImageName } from './docker-tags';
import { ImageService, type MetricReporter } from './image-service';
import { logger } from './logger';
import { getJobParameters } from './params';
import { Updater } from './updater';

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

  async run(outDir: string) {
    const { dependabotApiUrl, dependabotApiDockerUrl, jobId, jobToken, credentialsToken, secretMasker } = this.options;

    // create working directory if it does not exist
    const workingDirectory = join(outDir, `${jobId}`);
    if (!existsSync(workingDirectory)) await mkdir(workingDirectory, { recursive: true });

    const params = getJobParameters({
      jobId,
      jobToken,
      credentialsToken,
      dependabotApiUrl,
      dependabotApiDockerUrl: dependabotApiDockerUrl ?? dependabotApiUrl,
      updaterImage: this.options.updaterImage,
      workingDirectory,
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

export type RunJobResult = { success: true; message?: string } | { success: false; message: string };

export async function runJob({
  outDir,
  jobId,
  ...options
}: JobRunnerOptions & {
  outDir: string;
}): Promise<RunJobResult> {
  try {
    const runner = new JobRunner({ jobId, ...options });
    await runner.run(outDir);
  } catch (err) {
    if (err instanceof JobRunnerImagingError) {
      return { success: false, message: `Error fetching updater images: ${err.message}` };
    } else if (err instanceof JobRunnerUpdaterError) {
      return { success: false, message: `Error running updater: ${err.message}` };
    } else if (err instanceof CredentialFetchingError) {
      return { success: false, message: `Dependabot was unable to retrieve job credentials: ${err.message}` };
    } else {
      return { success: false, message: `Unknown error: ${(err as Error).message}` };
    }
  }
  logger.info(`Update job ${jobId} completed`);
  return { success: true };
}
