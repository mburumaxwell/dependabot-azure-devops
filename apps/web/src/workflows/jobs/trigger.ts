import { sleep } from 'workflow';
import type { UpdateJobTrigger } from '@/lib/prisma';

export type TriggerUpdateJobsWorkflowOptions = {
  organizationId: string;
  projectId: string;
  repositoryId: string;
  /**
   * Optional identifier of the repository update.
   * When `undefined` all updates in the repository are scheduled to run.
   */
  repositoryUpdateId?: number;
  trigger: UpdateJobTrigger;
};

export async function triggerUpdateJobs(options: TriggerUpdateJobsWorkflowOptions) {
  'use workflow';

  // TODO: implement trigger logic
  await sleep('1s');
}
