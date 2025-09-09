import { z } from 'zod/v4';
import { DependabotCooldownSchema } from './config';

// we use nullish() because it does optional() and allows the value to be set to null

export const DependabotCredentialSchema = z.record(z.string(), z.any());
export type DependabotCredential = z.infer<typeof DependabotCredentialSchema>;

export const CertificateAuthoritySchema = z.object({
  cert: z.string(),
  key: z.string(),
});
export type CertificateAuthority = z.infer<typeof CertificateAuthoritySchema>;

export const DependabotProxyConfigSchema = z.object({
  all_credentials: DependabotCredentialSchema.array(),
  ca: CertificateAuthoritySchema,
});
export type DependabotProxyConfig = z.infer<typeof DependabotProxyConfigSchema>;

export const DependabotSourceProviderSchema = z.enum(['azure']);
export type DependabotSourceProvider = z.infer<typeof DependabotSourceProviderSchema>;

export const DependabotSourceSchema = z.object({
  provider: DependabotSourceProviderSchema,
  repo: z.string(),
  directory: z.string().nullish(),
  directories: z.string().array().nullish(),
  branch: z.string().nullish(),
  commit: z.string().nullish(),
  hostname: z.string().nullish(), // Must be provided if api-endpoint is
  'api-endpoint': z.string().nullish(), // Must be provided if hostname is
  // TODO: refine to ensure either directory or directories is provided
  // TODO: refine to ensure either both hostname and api-endpoint have a value or both are undefined
});
export type DependabotSource = z.infer<typeof DependabotSourceSchema>;

export const DependabotExistingPRSchema = z.object({
  'dependency-name': z.string(),
  'dependency-version': z.string().nullish(),
  directory: z.string().nullish(),
  removed: z.boolean().nullish(),
});
export type DependabotExistingPR = z.infer<typeof DependabotExistingPRSchema>;

export const DependabotExistingGroupPRSchema = z.object({
  'dependency-group-name': z.string(),
  dependencies: DependabotExistingPRSchema.array(),
});
export type DependabotExistingGroupPR = z.infer<typeof DependabotExistingGroupPRSchema>;

export const DependabotAllowedSchema = z.object({
  'dependency-name': z.string().nullish(),
  'dependency-type': z.string().nullish(),
  'update-type': z.enum(['all', 'security']).optional(),
});
export type DependabotAllowed = z.infer<typeof DependabotAllowedSchema>;

export const DependabotGroupRuleJobSchema = z.object({
  patterns: z.string().array().nullish(),
  'exclude-patterns': z.string().array().nullish(),
  'dependency-type': z.string().nullish(),
  'update-types': z.string().array().nullish(),
});
export type DependabotGroupRuleJob = z.infer<typeof DependabotGroupRuleJobSchema>;

export const DependabotGroupJobSchema = z.object({
  name: z.string(),
  'applies-to': z.string().nullish(),
  rules: DependabotGroupRuleJobSchema,
});
export type DependabotGroupJob = z.infer<typeof DependabotGroupJobSchema>;

export const DependabotConditionSchema = z.object({
  'dependency-name': z.string(),
  source: z.string().nullish(),
  'update-types': z.string().array().nullish(),
  'updated-at': z.coerce.string().nullish(),
  'version-requirement': z.string().nullish(),
});
export type DependabotCondition = z.infer<typeof DependabotConditionSchema>;

export const DependabotSecurityAdvisorySchema = z.object({
  'dependency-name': z.string(),
  'affected-versions': z.string().array(),
  'patched-versions': z.string().array().nullish(), // may not be patched as of yet
  'unaffected-versions': z.string().array(),
});
export type DependabotSecurityAdvisory = z.infer<typeof DependabotSecurityAdvisorySchema>;

export const DependabotRequirementSourceSchema = z.record(z.string(), z.any());
export type DependabotRequirementSource = z.infer<typeof DependabotRequirementSourceSchema>;

export const DependabotRequirementSchema = z.object({
  file: z.string().nullish(), // e.g. 'requirements.txt' or '/Root.csproj'
  groups: z.string().array().nullish(), // e.g. ['dependencies']
  metadata: z.record(z.string(), z.any()).nullish(),
  requirement: z.string().nullish(), // e.g. '==3.2.0' or '8.1.0'
  source: DependabotRequirementSourceSchema.nullish(),
  version: z.string().nullish(),
  'previous-version': z.string().nullish(),
});
export type DependabotRequirement = z.infer<typeof DependabotRequirementSchema>;

export const DependabotDependencySchema = z.object({
  name: z.string(), // e.g. 'django' or 'GraphQL.Server.Ui.Voyager'
  'previous-requirements': DependabotRequirementSchema.array().nullish(),
  'previous-version': z.string().nullish(),
  version: z.string().nullish(), // e.g. '5.0.1' or '8.1.0'
  requirements: DependabotRequirementSchema.array().nullish(),
  removed: z.boolean().nullish(),
  directory: z.string().nullish(),
});
export type DependabotDependency = z.infer<typeof DependabotDependencySchema>;

export const DependabotCommitOptionsSchema = z.object({
  prefix: z.string().nullish(),
  'prefix-development': z.string().nullish(),
  'include-scope': z.boolean().nullish(),
});
export type DependabotCommitOptions = z.infer<typeof DependabotCommitOptionsSchema>;

export const DependabotExperimentsSchema = z.record(z.string(), z.union([z.string(), z.boolean()]));
export type DependabotExperiments = z.infer<typeof DependabotExperimentsSchema>;

export const DependabotPackageManagerSchema = z.enum([
  'bun',
  'bundler',
  'cargo',
  'composer',
  'devcontainers',
  'docker',
  'docker_compose', //  // ecosystem(s): 'docker-compose',
  'dotnet_sdk', // ecosystem(s): 'dotnet-sdk'
  'helm',
  'hex', // ecosystem(s): 'mix'
  'elm',
  'submodules', // ecosystem(s): 'gitsubmodule'
  'github_actions', // ecosystem(s): 'github-actions'
  'go_modules', // ecosystem(s): 'gomod'
  'gradle',
  'maven',
  'npm_and_yarn', // ecosystem(s): 'npm', 'pnpm', 'yarn'
  'nuget',
  'pip', // ecosystem(s): 'pipenv', 'pip-compile', 'poetry'
  'pub',
  'swift',
  'terraform',
  'uv',
]);
export type DependabotPackageManager = z.infer<typeof DependabotPackageManagerSchema>;

// See: https://github.com/dependabot/cli/blob/main/internal/model/job.go
//      https://github.com/dependabot/dependabot-core/blob/main/updater/lib/dependabot/job.rb
export const DependabotJobConfigSchema = z.object({
  id: z.number().optional(),
  'package-manager': DependabotPackageManagerSchema,
  'allowed-updates': DependabotAllowedSchema.array(),
  debug: z.boolean(),
  'dependency-groups': DependabotGroupJobSchema.array().nullish(),
  dependencies: z.string().array().nullable(),
  'dependency-group-to-refresh': z.string().nullish(),
  'existing-pull-requests': DependabotExistingPRSchema.array().array(),
  'existing-group-pull-requests': DependabotExistingGroupPRSchema.array(),
  experiments: DependabotExperimentsSchema,
  'ignore-conditions': DependabotConditionSchema.array(),
  'lockfile-only': z.boolean(),
  'requirements-update-strategy': z.string().nullable(),
  'security-advisories': DependabotSecurityAdvisorySchema.array(),
  'security-updates-only': z.boolean(),
  source: DependabotSourceSchema,
  'update-subdependencies': z.boolean(),
  'updating-a-pull-request': z.boolean(),
  'vendor-dependencies': z.boolean().nullish(),
  'reject-external-code': z.boolean().nullish(),
  'repo-private': z.boolean().nullish(),
  'commit-message-options': DependabotCommitOptionsSchema,
  'credentials-metadata': DependabotCredentialSchema.array().nullish(),
  'max-updater-run-time': z.int().nullish(),
  cooldown: DependabotCooldownSchema.nullish(),
  'proxy-log-response-body-on-auth-failure': z.boolean().nullish(),
  'enable-beta-ecosystems': z.boolean().nullish(),
  'multi-ecosystem-update': z.boolean().nullish(),
});
export type DependabotJobConfig = z.infer<typeof DependabotJobConfigSchema>;

export const DependabotJobFileSchema = z.object({
  job: DependabotJobConfigSchema,
});
export type DependabotJobFile = z.infer<typeof DependabotJobFileSchema>;

// Code below is borrowed and adapted from dependabot-action

// biome-ignore-start lint/suspicious/noExplicitAny: generic
export type FetchedFiles = {
  base_commit_sha: string;
  dependency_files: any[];
  base64_dependency_files: any[];
};
// biome-ignore-end lint/suspicious/noExplicitAny: generic

export type FileFetcherInput = {
  job: DependabotJobConfig;
};

export type FileUpdaterInput = FetchedFiles & {
  job: DependabotJobConfig;
};
