import { logger } from '@paklo/core/logger';
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
  await deleteExpiredInvitations();
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
  const result = await prisma.usageTelemetry.deleteMany({
    where: { started: { lt: oneYearAgo } },
  });

  logger.info(
    `Usage telemetry cleanup completed: deleted ${result.count} records older than ${oneYearAgo.toISOString()}`,
  );
}

/**
 * Deletes organization invitations that have expired.
 * An invitation is considered expired if its `expiresAt` date is earlier than the current date.
 * This step removes all such expired invitations from the database.
 */
async function deleteExpiredInvitations() {
  'use step';

  // Delete organization invitations that have expired (date in the database)
  const result = await prisma.invitation.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });

  logger.info(`Expired invitations cleanup completed: deleted ${result.count} expired invitations`);
}
