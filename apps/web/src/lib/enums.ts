import type { DependabotPackageManager } from '@paklo/core/dependabot';
import { z } from 'zod';

export type WithAll<T> = T | 'all';

export function unwrapWithAll<T>(value?: WithAll<T>): T | undefined {
  return value === 'all' ? undefined : value;
}

export const OrganizationTypeSchema = z.enum(['azure', 'bitbucket', 'gitlab']);
export type OrganizationType = z.infer<typeof OrganizationTypeSchema>;

export const RepositoryPullRequestStatusSchema = z.enum(['open', 'closed', 'merged']);
export type RepositoryPullRequestStatus = z.infer<typeof RepositoryPullRequestStatusSchema>;

export const SynchronizationStatusSchema = z.enum(['pending', 'success', 'failed']);
export type SynchronizationStatus = z.infer<typeof SynchronizationStatusSchema>;

export const SubscriptionStatusSchema = z.enum(['active', 'inactive', 'past_due', 'canceled']);
export type SubscriptionStatus = z.infer<typeof SubscriptionStatusSchema>;

export const UpdateJobStatusSchema = z.enum(['scheduled', 'running', 'succeeded', 'failed']);
export type UpdateJobStatus = z.infer<typeof UpdateJobStatusSchema>;

export const UpdateJobTriggerSchema = z.enum(['synchronization', 'scheduled', 'conflicts', 'comment', 'manual']);
export type UpdateJobTrigger = z.infer<typeof UpdateJobTriggerSchema>;

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
