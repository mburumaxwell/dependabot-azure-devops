import fs from 'node:fs';

// Code below is borrowed and adapted from dependabot-action

export function getImageName(dockerfileName: string): string {
  const dockerfile = fs.readFileSync(
    // dockerfile for the given package manager
    `docker/${dockerfileName}`,
    'utf8',
  );

  const imageName = dockerfile
    .split(/\n/)
    .find((a) => a.startsWith('FROM'))
    ?.replace('FROM', '')
    .trim();

  if (!imageName) {
    throw new Error(`Could not find an image name in ${dockerfile}`);
  }

  return imageName;
}

const manifest = {
  proxy: getImageName('Dockerfile.proxy'),
  bundler: getImageName('Dockerfile.bundler'),
  cargo: getImageName('Dockerfile.cargo'),
  composer: getImageName('Dockerfile.composer'),
  conda: getImageName('Dockerfile.conda'),
  pub: getImageName('Dockerfile.pub'),
  docker: getImageName('Dockerfile.docker'),
  elm: getImageName('Dockerfile.elm'),
  github_actions: getImageName('Dockerfile.github-actions'),
  submodules: getImageName('Dockerfile.gitsubmodule'),
  go_modules: getImageName('Dockerfile.gomod'),
  gradle: getImageName('Dockerfile.gradle'),
  maven: getImageName('Dockerfile.maven'),
  hex: getImageName('Dockerfile.mix'),
  nuget: getImageName('Dockerfile.nuget'),
  npm_and_yarn: getImageName('Dockerfile.npm'),
  pip: getImageName('Dockerfile.pip'),
  rust_toolchain: getImageName('Dockerfile.rust-toolchain'),
  swift: getImageName('Dockerfile.swift'),
  terraform: getImageName('Dockerfile.terraform'),
  devcontainers: getImageName('Dockerfile.devcontainers'),
  dotnet_sdk: getImageName('Dockerfile.dotnet-sdk'),
  bun: getImageName('Dockerfile.bun'),
  docker_compose: getImageName('Dockerfile.docker-compose'),
  uv: getImageName('Dockerfile.uv'),
  vcpkg: getImageName('Dockerfile.vcpkg'),
  helm: getImageName('Dockerfile.helm'),
  julia: getImageName('Dockerfile.julia'),
  bazel: getImageName('Dockerfile.bazel'),
  opentofu: getImageName('Dockerfile.opentofu'),
};

fs.writeFile(
  // output the manifest to containers.json
  `docker/containers.json`,
  JSON.stringify(manifest, null, 2),
  (err) => {
    if (err) {
      console.error(err);
    }
  },
);
