import type { SynchronizationStatus } from '@/lib/enums';

type ObjectCanBeSynchronized = {
  synchronizationStatus: SynchronizationStatus;
  synchronizedAt: Date | null;
};

/** Minimum interval between auto project synchronizations (7 days) */
export const MIN_AUTO_SYNC_INTERVAL_PROJECT = 7 * 24 * 3600 * 1000; // 7 days in milliseconds

/** Minimum interval between manual project synchronizations (24 hours) */
export const MIN_MANUAL_SYNC_INTERVAL_PROJECT = 24 * 3600 * 1000; // 24 hours in milliseconds

/** Minimum interval between manual repository synchronizations (15 minutes) */
export const MIN_MANUAL_SYNC_INTERVAL_REPOSITORY = 15 * 60 * 1000; // 15 minutes in milliseconds

/**
 * Check if manual sync is allowed for a project or repository based on its last sync time and status.
 * @param object The project or repository to check.
 * @returns True if synchronization is allowed, false otherwise.
 */
export function isManualSyncAllowed(object: ObjectCanBeSynchronized) {
  // don't allow sync if it's currently pending
  if (object.synchronizationStatus === 'pending') return false;

  // allow sync if it failed (no time restriction)
  if (object.synchronizationStatus === 'failed') return true;

  // for successful syncs, check if at least 24 hours have passed
  if (object.synchronizationStatus === 'success' && object.synchronizedAt) {
    const earliest = new Date(Date.now() - MIN_MANUAL_SYNC_INTERVAL_PROJECT);
    return new Date(object.synchronizedAt) <= earliest;
  }

  // allow sync otherwise
  return true;
}

/**
 * Get the next manual sync time for a project or repository.
 * @param object The project or repository to get the next sync time for.
 * @returns The next sync time or undefined if syncing is allowed immediately.
 */
export function getNextManualSyncTime(object: ObjectCanBeSynchronized) {
  // calculate time remaining until next sync is allowed
  return isManualSyncAllowed(object)
    ? undefined
    : new Date(new Date(object.synchronizedAt!).getTime() + MIN_MANUAL_SYNC_INTERVAL_PROJECT);
}
