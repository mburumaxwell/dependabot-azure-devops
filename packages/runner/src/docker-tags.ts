import dockerContainerConfig from '../../../dependabot-action/docker/containers.json';

export const PROXY_IMAGE_NAME = dockerContainerConfig.proxy;

export function updaterImageName(packageManager: string): string {
  return dockerContainerConfig[packageManager as keyof typeof dockerContainerConfig];
}

const updaterRegex = /ghcr.io\/dependabot\/dependabot-updater-([\w+])/;

export function updaterImages(): string[] {
  return Object.values(dockerContainerConfig).filter((image) => image.match(updaterRegex));
}

const imageNamePattern =
  '^(?<repository>(([a-zA-Z0-9._-]+([:[0-9]+[^/]))?([a-zA-Z0-9._/-]+)?))(:[a-zA-Z0-9._/-]+)?(?<digest>@sha256:[a-zA-Z0-9]{64})?$';

export function repositoryName(imageName: string): string {
  const match = imageName.match(imageNamePattern);

  if (match?.groups) {
    return match.groups.repository!;
  } else {
    throw Error('invalid image name');
  }
}

export function hasDigest(imageName: string): boolean {
  const match = imageName.match(imageNamePattern);

  if (match?.groups) {
    if (match?.groups.digest) {
      return true;
    }
    return false;
  } else {
    throw Error('invalid image name');
  }
}

export function digestName(imageName: string): string {
  const match = imageName.match(imageNamePattern);

  if (match?.groups) {
    return match.groups.repository! + match.groups.digest;
  } else {
    throw Error('invalid image name');
  }
}
