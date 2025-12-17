import type { DependabotPackageManager } from '@paklo/core/dependabot';
import type { UpdateJobStatus, UpdateJobTrigger } from '@/lib/prisma';

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
  submodules: 'Git Submodules',
  go_modules: 'Go Modules',
  gradle: 'Gradle',
  maven: 'Maven',
  hex: 'Hex',
  nuget: 'NuGet',
  npm_and_yarn: 'npm & Yarn',
  pip: 'Pip',
  rust_toolchain: 'Rust Toolchain',
  swift: 'Swift',
  terraform: 'Terraform',
  devcontainers: 'Devcontainers',
  dotnet_sdk: '.NET SDK',
  bun: 'Bun',
  docker_compose: 'Docker Compose',
  uv: 'uv',
  vcpkg: 'vcpkg',
  helm: 'Helm',
  julia: 'Julia',
  bazel: 'Bazel',
  opentofu: 'OpenTofu',
};
export const packageManagerOptions: { value: DependabotPackageManager; label: string }[] = Object.entries(
  packageManagerLabelMap,
).map(([value, label]) => ({ value: value as DependabotPackageManager, label }));

const updateJobStatusLabelMap: Record<UpdateJobStatus, string> = {
  scheduled: 'Scheduled',
  running: 'Running',
  succeeded: 'Succeeded',
  failed: 'Failed',
};
export const updateJobStatusOptions: { value: UpdateJobStatus; label: string }[] = Object.entries(
  updateJobStatusLabelMap,
).map(([value, label]) => ({ value: value as UpdateJobStatus, label }));

const updateJobTriggerLabelMap: Record<UpdateJobTrigger, string> = {
  scheduled: 'Scheduled',
  synchronization: 'Synchronization',
  comment: 'Comment',
  conflicts: 'Conflicts',
  manual: 'Manual',
};
export const updateJobTriggerOptions: { value: UpdateJobTrigger; label: string }[] = Object.entries(
  updateJobTriggerLabelMap,
).map(([value, label]) => ({ value: value as UpdateJobTrigger, label }));
