import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

import { PROXY_IMAGE_NAME, updaterImageName } from './docker-tags';
import { ImageService, type MetricReporter } from './image-service';
import { type DependabotCredential, type DependabotJobConfig } from './job';
import { logger } from './logger';
import { getJobParameters } from './params';
import { Updater } from './updater';

export class JobRunnerImagingError extends Error {}
export class JobRunnerUpdaterError extends Error {}

export type JobRunnerOptions = {
  dependabotApiUrl: string;
  job: DependabotJobConfig;
  jobToken: string;
  credentialsToken: string;
};

export class JobRunner {
  private readonly options: JobRunnerOptions;

  constructor(options: JobRunnerOptions) {
    this.options = options;
  }

  async run({ outDir, credentials: creds }: { outDir: string; credentials?: DependabotCredential[] }) {
    const { dependabotApiUrl, job, jobToken, credentialsToken } = this.options;

    // create working directory if it does not exist
    const workingDirectory = join(outDir, `${job.id}`);
    if (!existsSync(workingDirectory)) await mkdir(workingDirectory, { recursive: true });

    const params = getJobParameters({
      jobId: job.id!,
      jobToken,
      credentialsToken,
      // using same value for dependabotApiUrl and dependabotApiDockerUrl so as to capture /record_metrics calls
      dependabotApiUrl,
      dependabotApiDockerUrl: dependabotApiUrl,
      updaterImage: undefined,
      workingDirectory,
    })!;

    // The params can specify which updater image to use. If it doesn't, fall back to the pinned version.
    const updaterImage = params.updaterImage || updaterImageName(job['package-manager']);

    // The sendMetrics function is used to send metrics to the API client.
    // It uses the package manager as a tag to identify the metric.
    const sendMetricsWithPackageManager: MetricReporter = async (name, metricType, value, additionalTags = {}) => {
      // TODO: implement this
      logger.debug(`Metric: ${name}=${value} (${metricType}) [${JSON.stringify(additionalTags)}]`);
      // try {
      //   await apiClient.sendMetrics(name, metricType, value, {
      //     package_manager: job['package-manager'],
      //     ...additionalTags
      //   })
      // } catch (error) {
      //   logger.warn(
      //     `Metric sending failed for ${name}: ${(error as Error).message}`
      //   )
      // }
    };

    const credentials = creds || [];

    const updater = new Updater(updaterImage, PROXY_IMAGE_NAME, params, job, credentials);

    try {
      // Using sendMetricsWithPackageManager wrapper to inject package manager tag ti
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
  dependabotApiUrl,
  job,
  jobToken,
  credentialsToken,
  credentials,
}: {
  outDir: string;
  dependabotApiUrl: string;
  job: DependabotJobConfig;
  jobToken: string;
  credentialsToken: string;
  credentials: DependabotCredential[];
}): Promise<RunJobResult> {
  try {
    const runner = new JobRunner({ dependabotApiUrl, job, jobToken, credentialsToken });
    await runner.run({ outDir, credentials });
  } catch (err) {
    if (err instanceof JobRunnerImagingError) {
      return { success: false, message: `Error fetching updater images: ${err.message}` };
    } else if (err instanceof JobRunnerUpdaterError) {
      return { success: false, message: `Error running updater: ${err.message}` };
    } else {
      return { success: false, message: `Unknown error: ${(err as Error).message}` };
    }
  }
  logger.info(`Update job ${job.id} completed`);
  return { success: true };
}
