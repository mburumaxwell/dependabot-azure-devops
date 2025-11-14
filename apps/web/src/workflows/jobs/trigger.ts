import { sleep } from 'workflow';
import type { UpdateJobTrigger } from '@/lib/prisma';

export type TriggerUpdateJobsWorkflowOptions = {
  organizationId: string;
  projectId: string;
  repositoryId: string;
  /**
   * Optional identifiers of the repository updates.
   * When `undefined` or an empty array all updates in the repository are scheduled to run.
   */
  repositoryUpdateIds?: string[];
  trigger: UpdateJobTrigger;
};

export async function triggerUpdateJobs(options: TriggerUpdateJobsWorkflowOptions) {
  'use workflow';

  // TODO: implement trigger logic
  await sleep('1s');
}
