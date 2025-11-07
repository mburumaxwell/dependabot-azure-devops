import { Hono } from 'hono';
import { bearerAuth } from 'hono/bearer-auth';
import { handle } from 'hono/vercel';

import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const app = new Hono().basePath('/api/crons');

// crons are secured via a middleware at a higher level using a secret token
// the Authorization header must be set to `Bearer <CRON_SECRET>`
// https://vercel.com/docs/cron-jobs/manage-cron-jobs?framework=other#securing-cron-jobs
app.use(bearerAuth({ token: process.env.CRON_SECRET! }));

app.get('/cleanup/database', async (context) => {
  async function deleteUsageTelemetry() {
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
    // Delete organization invitations that have expired (date in the database)
    const result = await prisma.invitation.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });

    logger.info(`Expired invitations cleanup completed: deleted ${result.count} expired invitations`);
  }

  await deleteUsageTelemetry();
  await deleteExpiredInvitations();

  return context.body(null, 204);
});

// Additional cron endpoints can be added here

export const GET = handle(app);
