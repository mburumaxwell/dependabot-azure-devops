import { logger } from '@/lib/logger';
import { getMongoCollection } from '@/lib/mongodb';
import { prisma } from '@/lib/prisma';

/**
 * Workflow to periodically clean up the database by removing outdated records.
 *
 * Cleans up:
 * - Usage telemetry records older than one year.
 * - Expired organization invitations.
 *
 * Schedule/Trigger expectations:
 * This workflow is intended to be run as a scheduled job (e.g., daily or weekly)
 * or triggered by an external scheduler to maintain database hygiene.
 */
export async function cleanupDatabase() {
  'use workflow';

  await deleteUsageTelemetry();
  await deleteExpiredRecords();
  await deleteOldRecords();
}

/**
 * Deletes usage telemetry records from the database that are older than 1 year.
 * This function enforces a data retention policy by removing telemetry data
 * whose 'started' date is more than one year in the past.
 * Retention period: 1 year.
 */
async function deleteUsageTelemetry() {
  'use step';

  // Delete usage telemetry records older than 1 year
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const collection = await getMongoCollection('usage_telemetry');
  const result = await collection.deleteMany({
    started: { $lt: oneYearAgo },
  });

  logger.info(
    `Usage telemetry cleanup completed: deleted ${result.deletedCount} records older than ${oneYearAgo.toISOString()}`,
  );
}

/** Deletes expired records from the database. */
async function deleteExpiredRecords() {
  'use step';

  const now = new Date();

  /**
   * Delete organization invitations that have expired
   * An invitation is considered expired if its `expiresAt` date is earlier than the current date.
   */
  let result = await prisma.invitation.deleteMany({
    where: { expiresAt: { lt: now } },
  });
  logger.info(`Expired invitations cleanup completed: deleted ${result.count} expired invitations`);

  /**
   * Delete verifications that have expired
   * A verification is considered expired if its `expiresAt` date is earlier than the current date.
   */
  result = await prisma.verification.deleteMany({
    where: { expiresAt: { lt: now } },
  });
  logger.info(`Expired verifications cleanup completed: deleted ${result.count} expired verifications`);
}

/** Deletes old records (deletable) from the database. */
async function deleteOldRecords() {
  'use step';

  // we keep deletable data for 90 days
  const threshold = new Date();
  threshold.setDate(threshold.getDate() - 90); // 90 days ago

  // remove completed pull requests older than threshold
  const result = await prisma.repositoryPullRequest.deleteMany({
    where: {
      updatedAt: { lt: threshold },
      status: { in: ['merged', 'closed'] },
    },
  });
  logger.info(
    `Old pull requests cleanup completed: deleted ${result.count} pull requests updated before ${threshold.toISOString()}`,
  );
}
