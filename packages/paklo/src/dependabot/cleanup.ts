import Docker from 'dockerode';

import { PROXY_IMAGE_NAME, digestName, hasDigest, repositoryName, updaterImages } from './docker-tags';
import { logger } from './logger';

// Code below is borrowed and adapted from dependabot-action

// This method performs housekeeping checks to remove Docker artifacts
// which were left behind by old versions or any jobs
// which may have crashed before deleting their own containers or networks
//
// cutoff - a Go duration string to pass to the Docker API's 'until' argument, default '24h'
export async function cleanup(cutoff = '24h'): Promise<void> {
  if (process.env.DEPENDABOT_DISABLE_CLEANUP === '1') {
    return;
  }

  try {
    const docker = new Docker();
    const untilFilter = { until: [cutoff] };
    logger.info(`Pruning networks older than ${cutoff}`);
    await docker.pruneNetworks({ filters: untilFilter });
    logger.info(`Pruning containers older than ${cutoff}`);
    await docker.pruneContainers({ filters: untilFilter });
    await Promise.all(
      updaterImages().map(async (image) => {
        return cleanupOldImageVersions(docker, image);
      }),
    );
    await cleanupOldImageVersions(docker, PROXY_IMAGE_NAME);
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error(`Error cleaning up: ${error.message}`);
    }
  }
}

export async function cleanupOldImageVersions(docker: Docker, imageName: string): Promise<void> {
  const repo = repositoryName(imageName);
  const options = {
    filters: `{"reference":["${repo}"]}`,
  };

  logger.info(`Cleaning up images for ${repo}`);

  docker.listImages(options, async function (err, imageInfoList) {
    if (imageInfoList && imageInfoList.length > 0) {
      for (const imageInfo of imageInfoList) {
        // The given imageName is expected to be a tag + digest, however to avoid any surprises in future
        // we fail over to check for a match on just tags as well.
        //
        // This means we won't remove any image which matches an imageName of either of these notations:
        // - dependabot/image:$TAG@sha256:$REF (current implementation)
        // - dependabot/image:v1
        //
        // Without checking imageInfo.RepoTags for a match, we would actually remove the latter even if
        // this was the active version.
        if (imageMatches(imageInfo, imageName)) {
          logger.info(`Skipping current image ${imageInfo.Id}`);
          continue;
        }

        logger.info(`Removing image ${imageInfo.Id}`);
        try {
          await docker.getImage(imageInfo.Id).remove();
        } catch (error: unknown) {
          if (error instanceof Error) {
            logger.info(`Unable to remove ${imageInfo.Id} -- ${error.message}`);
          }
        }
      }
    }
  });
}

function imageMatches(imageInfo: Docker.ImageInfo, imageName: string): boolean {
  if (hasDigest(imageName)) {
    return imageInfo.RepoDigests ? imageInfo.RepoDigests.includes(digestName(imageName)) : false;
  }
  return imageInfo.RepoTags ? imageInfo.RepoTags.includes(imageName) : false;
}
