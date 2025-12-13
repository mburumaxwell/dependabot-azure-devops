import type { DependabotPackageManager } from '@paklo/core/dependabot';

export type WithAll<T> = T | 'all';

export function unwrapWithAll<T>(value?: WithAll<T>): T | undefined {
  return value === 'all' ? undefined : value;
}

const packageManagerLabelMap: Record<DependabotPackageManager, string> = {
  bundler: 'Bundler',
  cargo: 'Cargo',
  composer: 'Composer',
  conda: 'Conda',
  pub: 'Pub',
  docker: 'Docker',
  elm: 'Elm',
  github_actions: 'GitHub Actions',
  submodules: 'Submodules',
  go_modules: 'Go Modules',
  gradle: 'Gradle',
  maven: 'Maven',
  hex: 'Hex',
  nuget: 'NuGet',
  npm_and_yarn: 'NPM and Yarn',
  pip: 'Pip',
  rust_toolchain: 'Rust Toolchain',
  swift: 'Swift',
  terraform: 'Terraform',
  devcontainers: 'Devcontainers',
  dotnet_sdk: 'Dotnet SDK',
  bun: 'Bun',
  docker_compose: 'Docker Compose',
  uv: 'UV',
  vcpkg: 'vcpkg',
  helm: 'Helm',
  julia: 'Julia',
  bazel: 'Bazel',
  opentofu: 'OpenTofu',
};

export const packageManagerOptions: { value: DependabotPackageManager; label: string }[] = Object.entries(
  packageManagerLabelMap,
).map(([value, label]) => ({ value: value as DependabotPackageManager, label }));
