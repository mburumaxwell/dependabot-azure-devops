import type { SynchronizationStatus } from '@/lib/prisma';

type ObjectCanBeSynchronized = {
  synchronizationStatus: SynchronizationStatus;
  synchronizedAt: Date | null;
};

/** Minimum interval between project synchronizations (24 hours) */
export const MIN_PROJECT_SYNC_INTERVAL = 24 * 3600 * 1000; // 24 hours in milliseconds

/**
 * Check if synchronization is allowed for a project or repository based on its last sync time and status.
 * @param object The project or repository to check.
 * @returns True if synchronization is allowed, false otherwise.
 */
export function isSyncAllowed(object: ObjectCanBeSynchronized) {
  // don't allow sync if it's currently pending
  if (object.synchronizationStatus === 'pending') return false;

  // allow sync if it failed (no time restriction)
  if (object.synchronizationStatus === 'failed') return true;

  // for successful syncs, check if at least 24 hours have passed
  if (object.synchronizationStatus === 'success' && object.synchronizedAt) {
    const earliest = new Date(Date.now() - MIN_PROJECT_SYNC_INTERVAL);
    return new Date(object.synchronizedAt) <= earliest;
  }

  // allow sync otherwise
  return true;
}

/**
 * Get the next sync time for a project or repository.
 * @param object The project or repository to get the next sync time for.
 * @returns The next sync time or undefined if syncing is allowed immediately.
 */
export function getNextSyncTime(object: ObjectCanBeSynchronized) {
  // calculate time remaining until next sync is allowed
  return isSyncAllowed(object)
    ? undefined
    : new Date(new Date(object.synchronizedAt!).getTime() + MIN_PROJECT_SYNC_INTERVAL);
}
