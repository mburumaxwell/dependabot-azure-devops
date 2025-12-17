import { z } from 'zod';
import { DependabotDependencySchema, DependabotPackageManagerSchema } from './job';

// we use nullish() because it does optional() and allows the value to be set to null

export const DependabotDependencyFileSchema = z.object({
  // https://github.com/dependabot/dependabot-core/blob/5e2711f9913cc387acb7cb0d29d51fb52d235ef2/common/lib/dependabot/dependency_file.rb#L14-L15
  content: z.string().nullish(),
  content_encoding: z
    .enum([
      'utf-8',
      'base64',
      // for some reason, some files (e.g. txt in gomod) are marked as empty string encoding
      '',
    ])
    .nullish(),
  deleted: z.boolean().nullish(),
  directory: z.string(),
  name: z.string(),
  operation: z.enum(['update', 'create', 'delete']),
  support_file: z.boolean().nullish(),
  vendored_file: z.boolean().nullish(),
  symlink_target: z.string().nullish(),
  type: z.string().nullish(),
  mode: z
    .enum({
      executable: '100755',
      file: '100644',
      directory: '040000',
      submodule: '160000',
      symlink: '120000',
    })
    .or(z.string())
    .nullish(),
});
export type DependabotDependencyFile = z.infer<typeof DependabotDependencyFileSchema>;

export const DependabotUpdateDependencyListSchema = z.object({
  dependencies: DependabotDependencySchema.array(),
  dependency_files: z.string().array().nullish(),
});
export type DependabotUpdateDependencyList = z.infer<typeof DependabotUpdateDependencyListSchema>;

export const DependabotDependencySubmissionSchema = z.object({
  version: z.number(),
  sha: z.string(),
  ref: z.string(),
  job: z.object({
    correlator: z.string(),
    id: z.string(),
  }),
  detector: z.object({
    name: z.string(),
    version: z.string(),
    url: z.string(),
  }),
  manifests: z.object({
    name: z.string().nullish(),
    file: z.object({ source_location: z.string() }).nullish(),
    metadata: z.object({ ecosystem: DependabotPackageManagerSchema }).nullish(),
    resolved: z
      .object({
        package_url: z.string(),
        relationship: z.enum(['direct', 'indirect']),
        scope: z.enum(['runtime', 'development']),
        dependencies: DependabotDependencySchema.array(),
      })
      .nullish(),
  }),
});
export type DependabotDependencySubmission = z.infer<typeof DependabotDependencySubmissionSchema>;

export const DependabotCreatePullRequestSchema = z.object({
  'base-commit-sha': z.string(),
  dependencies: DependabotDependencySchema.array(),
  'updated-dependency-files': DependabotDependencyFileSchema.array(),
  'pr-title': z.string(),
  'pr-body': z.string().nullish(),
  'commit-message': z.string(),
  'dependency-group': z.record(z.string(), z.any()).nullish(),
});
export type DependabotCreatePullRequest = z.infer<typeof DependabotCreatePullRequestSchema>;

export const DependabotUpdatePullRequestSchema = z.object({
  'base-commit-sha': z.string(),
  'dependency-names': z.string().array(),
  'updated-dependency-files': DependabotDependencyFileSchema.array(),
  'pr-title': z.string().nullish(), // this is usually excluded when working with dependabot-cli and an empty string if the API
  'pr-body': z.string().nullish(), // this is usually excluded when working with dependabot-cli and an empty string if the API
  'commit-message': z.string().nullish(), // this is usually excluded when working with dependabot-cli and an empty string if the API
  'dependency-group': z.record(z.string(), z.any()).nullish(),
});
export type DependabotUpdatePullRequest = z.infer<typeof DependabotUpdatePullRequestSchema>;

export const DependabotClosePullRequestReasonEnum = z.enum([
  'dependencies_changed',
  'dependency_group_empty',
  'dependency_removed',
  'up_to_date',
  'update_no_longer_possible',
]);
export type DependabotClosePullRequestReason = z.infer<typeof DependabotClosePullRequestReasonEnum>;
export const DependabotClosePullRequestSchema = z.object({
  'dependency-names': z.string().array(),
  reason: DependabotClosePullRequestReasonEnum.nullish(),
});
export type DependabotClosePullRequest = z.infer<typeof DependabotClosePullRequestSchema>;

export const DependabotMarkAsProcessedSchema = z.object({
  'base-commit-sha': z.string().nullish(),
});
export type DependabotMarkAsProcessed = z.infer<typeof DependabotMarkAsProcessedSchema>;

export const DependabotJobErrorSchema = z.object({
  'error-type': z.string(),
  'error-details': z.record(z.string(), z.any()).nullish(),
  unknown: z.boolean().nullish(), // own property to differentiate between known and unknown errors
});
export type DependabotJobError = z.infer<typeof DependabotJobErrorSchema>;

export const DependabotRecordUpdateJobErrorSchema = DependabotJobErrorSchema.extend({});
export type DependabotRecordUpdateJobError = z.infer<typeof DependabotRecordUpdateJobErrorSchema>;

export const DependabotRecordUpdateJobWarningSchema = z.object({
  'warn-type': z.string(),
  'warn-title': z.string(),
  'warn-description': z.string(),
});
export type DependabotRecordUpdateJobWarning = z.infer<typeof DependabotRecordUpdateJobWarningSchema>;

export const DependabotRecordUpdateJobUnknownErrorSchema = DependabotJobErrorSchema.extend({});
export type DependabotRecordUpdateJobUnknownError = z.infer<typeof DependabotRecordUpdateJobUnknownErrorSchema>;

export const DependabotRecordEcosystemVersionsSchema = z.object({
  ecosystem_versions: z.record(z.string(), z.any()).nullish(),
});
export type DependabotRecordEcosystemVersions = z.infer<typeof DependabotRecordEcosystemVersionsSchema>;

export const DependabotEcosystemVersionManagerSchema = z.object({
  name: z.string(),
  version: z.string(),
  raw_version: z.string(),
  requirement: z.record(z.string(), z.any()).nullish(),
});
export type DependabotEcosystemVersionManager = z.infer<typeof DependabotEcosystemVersionManagerSchema>;

export const DependabotEcosystemMetaSchema = z.object({
  name: z.string(),
  package_manager: DependabotEcosystemVersionManagerSchema.nullish(),
  language: DependabotEcosystemVersionManagerSchema.nullish(),
  version: DependabotEcosystemVersionManagerSchema.nullish(),
});
export type DependabotEcosystemMeta = z.infer<typeof DependabotEcosystemMetaSchema>;

export const DependabotRecordEcosystemMetaSchema = z.object({
  ecosystem: DependabotEcosystemMetaSchema,
});
export type DependabotRecordEcosystemMeta = z.infer<typeof DependabotRecordEcosystemMetaSchema>;

export const DependabotRecordCooldownMetaSchema = z.object({
  cooldown: z.object({
    ecosystem_name: DependabotPackageManagerSchema,
    config: z.object({
      default_days: z.number(),
      semver_major_days: z.number(),
      semver_minor_days: z.number(),
      semver_patch_days: z.number(),
    }),
  }),
});
export type DependabotRecordCooldownMeta = z.infer<typeof DependabotRecordCooldownMetaSchema>;

export const DependabotIncrementMetricSchema = z.object({
  metric: z.string(),
  tags: z.record(z.string(), z.any()).nullish(),
});
export type DependabotIncrementMetric = z.infer<typeof DependabotIncrementMetricSchema>;

export const DependabotMetricSchema = z.object({
  metric: z.string(),
  type: z.enum(['increment', 'gauge', 'distribution', 'histogram']),
  value: z.number().nullish(),
  values: z.number().array().nullish(),
  tags: z.record(z.string(), z.string()).nullish(),
});
export type DependabotMetric = z.infer<typeof DependabotMetricSchema>;
