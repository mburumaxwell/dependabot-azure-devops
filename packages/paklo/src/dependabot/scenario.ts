import { z } from 'zod/v4';
import { DependabotCredentialSchema, DependabotJobConfigSchema } from './job';

// TODO: reconsider if we need all these once we stop using dependabot-cli

export const DependabotInputSchema = z.object({
  jobId: z.number().default(0),
  job: DependabotJobConfigSchema,
  credentials: DependabotCredentialSchema.array(),
});
export type DependabotInput = z.infer<typeof DependabotInputSchema>;

export const DependabotOperationTypeSchema = z.enum([
  'create_pull_request',
  'update_pull_request',
  'close_pull_request',
  'record_update_job_error',
  'record_update_job_unknown_error',
  'mark_as_processed',
  'update_dependency_list',
  'record_ecosystem_versions',
  'record_ecosystem_meta',
  'increment_metric',
  'record_metrics',
]);
export type DependabotOperationType = z.infer<typeof DependabotOperationTypeSchema>;
