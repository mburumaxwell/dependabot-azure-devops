import { Hono } from 'hono';
import { bearerAuth } from 'hono/bearer-auth';
import { handle } from 'hono/vercel';
import { start } from 'workflow/api';
import { requestSync } from '@/actions/sync';
import { getNextRunDate } from '@/lib/cron';
import { prisma } from '@/lib/prisma';
import { MIN_AUTO_SYNC_INTERVAL_PROJECT } from '@/lib/sync';
import { cleanupDatabase } from '@/workflows/cleanup-database';
import { triggerUpdateJobs } from '@/workflows/jobs';

export const dynamic = 'force-dynamic';

const app = new Hono().basePath('/api/crons');

// crons are secured via a middleware at a higher level using a secret token
// the Authorization header must be set to `Bearer <CRON_SECRET>`
// https://vercel.com/docs/cron-jobs/manage-cron-jobs?framework=other#securing-cron-jobs
app.use(bearerAuth({ token: process.env.CRON_SECRET! }));

app.get('/cleanup/database', async (context) => {
  await start(cleanupDatabase, []);
  return context.body(null, 204);
});

app.get('/trigger-sync-projects', async (context) => {
  // find projects that are eligible for sync
  const lastSyncTime = Date.now() - MIN_AUTO_SYNC_INTERVAL_PROJECT;
  const projectsToSync = await prisma.project.findMany({
    where: {
      synchronizationStatus: { not: 'pending' },
      synchronizedAt: { lte: new Date(lastSyncTime) },
    },
    take: 100,
  });

  // trigger sync for each project
  for (const project of projectsToSync) {
    await requestSync({
      organizationId: project.organizationId,
      projectId: project.id,
      scope: 'all',
    });
  }

  return context.body(null, 204);
});

app.get('/trigger-update-jobs', async (context) => {
  // find all repository updates that are due
  const dueRepositoryUpdates = await prisma.repositoryUpdate.findMany({
    where: { enabled: true, nextUpdateJobAt: { lte: new Date() } },
    orderBy: { nextUpdateJobAt: 'asc' },
    take: 500,
  });

  // fetch related data
  const repositoryIds = Array.from(new Set(dueRepositoryUpdates.map((u) => u.repositoryId)));
  const repositories = await prisma.repository.findMany({ where: { id: { in: repositoryIds } } });
  const repositoryMap = new Map(repositories.map((r) => [r.id, r]));
  const projectIds = Array.from(new Set(repositories.map((r) => r.projectId)));
  const projects = await prisma.project.findMany({ where: { id: { in: projectIds } } });
  const projectMap = new Map(projects.map((p) => [p.id, p]));
  const organizationIds = Array.from(new Set(projects.map((p) => p.organizationId)));
  const organizations = await prisma.organization.findMany({
    where: { id: { in: organizationIds } },
  });
  const organizationMap = new Map(organizations.map((o) => [o.id, o]));

  // trigger a sync for each due update
  for (const update of dueRepositoryUpdates) {
    const nextUpdateJobAt = getNextRunDate(update.cron, update.timezone);
    await prisma.repositoryUpdate.update({
      where: { id: update.id },
      data: { nextUpdateJobAt },
    });

    const repository = repositoryMap.get(update.repositoryId)!;
    const project = projectMap.get(repository.projectId)!;
    const organization = organizationMap.get(project.organizationId)!;

    // trigger update jobs
    await start(triggerUpdateJobs, [
      {
        organizationId: organization.id,
        projectId: project.id,
        repositoryId: repository.id,
        repositoryUpdateIds: [update.id],
        trigger: 'scheduled',
      },
    ]);
  }
  return context.body(null, 204);
});

// Additional cron endpoints can be added here

export const GET = handle(app);
