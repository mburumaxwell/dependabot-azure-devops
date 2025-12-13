'use server';

import { start } from 'workflow/api';
import { prisma } from '@/lib/prisma';
import { type SyncWorkflowOptions, synchronizeWithProvider } from '@/workflows/sync';

export type RequestSyncOptions = SyncWorkflowOptions;

/**
 * Request synchronization for a project or repository.
 * @param options The synchronization options.
 */
export async function requestSync(options: RequestSyncOptions) {
  await start(synchronizeWithProvider, [options]);
  return await prisma.project.update({
    where: { id: options.projectId, organizationId: options.organizationId },
    data: { synchronizationStatus: 'pending' },
  });
}
