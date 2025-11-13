import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

export async function cleanupDatabase() {
  'use workflow';

  await deleteUsageTelemetry();
  await deleteExpiredInvitations();
}

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

async function deleteExpiredInvitations() {
  'use step';

  // Delete organization invitations that have expired (date in the database)
  const result = await prisma.invitation.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });

  logger.info(`Expired invitations cleanup completed: deleted ${result.count} expired invitations`);
}
