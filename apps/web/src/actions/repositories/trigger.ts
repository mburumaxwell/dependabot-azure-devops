'use server';

import { start } from 'workflow/api';
import { type TriggerUpdateJobsWorkflowOptions, triggerUpdateJobs } from '@/workflows/jobs/trigger';

export type RequestTriggerUpdateJobsOptions = TriggerUpdateJobsWorkflowOptions;

/**
 * Trigger update jobs.
 * @param options
 */
export async function requestTriggerUpdateJobs(options: RequestTriggerUpdateJobsOptions) {
  // trigger update jobs
  await start(triggerUpdateJobs, [options]);
}
