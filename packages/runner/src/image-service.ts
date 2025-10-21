import { Readable } from 'node:stream';
import Docker from 'dockerode';

import { logger } from '@/logger';

const MAX_RETRIES = 5; // Maximum number of retries
const INITIAL_DELAY_MS = 2000; // Initial delay in milliseconds for backoff

// Code below is borrowed and adapted from dependabot-action

const sleep = async (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const endOfStream = async (docker: Docker, stream: Readable): Promise<void> => {
  return new Promise((resolve, reject) => {
    docker.modem.followProgress(stream, (err: Error | null) => (err ? reject(err) : resolve(undefined)));
  });
};

export function getOrgFromImage(imageName: string): string {
  const parts = imageName.split('/');
  if (parts.length >= 3 && parts[0] === 'ghcr.io') {
    return parts[1]!; // The domain is always the second part
  }
  return 'unknown'; // Fallback case if structure is unexpected
}

export type MetricReporter = (
  metricName: string,
  metricType: 'increment' | 'gauge',
  value: number,
  additionalTags?: Record<string, string>,
) => Promise<void>;

/** Fetch the configured updater image, if it isn't already available. */
export const ImageService = {
  async pull(imageName: string, sendMetric?: MetricReporter, force = false): Promise<void> {
    /*
      This method fetches images hosts on GitHub infrastructure.

      We expose the `fetch_image` utility method to allow us to pull in arbitrary images for unit tests.
    */
    if (!(imageName.startsWith('ghcr.io/') || imageName.startsWith('docker.pkg.github.com/'))) {
      throw new Error('Only images distributed via docker.pkg.github.com or ghcr.io can be fetched');
    }

    const docker = new Docker();
    const org = getOrgFromImage(imageName);
    try {
      const image = await docker.getImage(imageName).inspect();
      if (!force) {
        logger.info(`Resolved ${imageName} to existing ${image.RepoDigests}`);
        return;
      } // else fallthrough to pull
    } catch (e: unknown) {
      if (e instanceof Error && !e.message.includes('no such image')) {
        throw e;
      } // else fallthrough to pull
    }

    const auth = {}; // Images are public so not authentication info is required
    await this.fetchImageWithRetry(imageName, auth, docker, sendMetric, org);
  },

  /* Retrieve the image using the auth details provided, if any with retry and backoff */
  async fetchImageWithRetry(
    imageName: string,
    auth = {},
    docker = new Docker(),
    sendMetric: MetricReporter | undefined,
    org: string,
  ): Promise<void> {
    let attempt = 0;

    while (attempt < MAX_RETRIES) {
      try {
        logger.info(`Pulling image ${imageName} (attempt ${attempt + 1})...`);
        /* To avoid sending metrics during unit tests (fetch_image) */
        if (sendMetric) {
          await sendMetric('ghcr_image_pull', 'increment', 1, {
            org,
          });
        }
        const stream = await docker.pull(imageName, { authconfig: auth });
        await endOfStream(docker, new Readable().wrap(stream));
        logger.info(`Pulled image ${imageName}`);
        return; // Exit on success
      } catch (error) {
        if (!(error instanceof Error)) throw error; // Ensure error is an instance of Error

        // Handle 429 Too Many Requests separately
        if (
          error.message.includes('429 Too Many Requests') ||
          error.message.toLowerCase().includes('too many requests')
        ) {
          attempt++; // Only increment attempt on 429
          if (attempt >= MAX_RETRIES) {
            logger.error(`Failed to pull image ${imageName} after ${MAX_RETRIES} attempts.`);
            throw error;
          }

          // Add jitter to avoid synchronization issues
          // biome-ignore lint/style/useExponentiationOperator: This is clearer for now
          const baseDelay = INITIAL_DELAY_MS * Math.pow(2, attempt);
          const jitter = Math.random() * baseDelay;
          const delay = baseDelay / 2 + jitter;

          logger.warn(`Received Too Many Requests error. Retrying in ${(delay / 1000).toFixed(2)} seconds...`);
          await sleep(delay);
        } else {
          // Non-429 errors should NOT be retried
          logger.error(`Fatal error pulling image ${imageName}: ${error.message}`);
          throw error; // Exit immediately
        }
      }
    }
  },
};
