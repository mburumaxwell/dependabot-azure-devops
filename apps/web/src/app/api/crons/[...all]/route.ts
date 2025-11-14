import { Hono } from 'hono';
import { bearerAuth } from 'hono/bearer-auth';
import { handle } from 'hono/vercel';
import { start } from 'workflow/api';
import { cleanupDatabase } from '@/workflows/cleanup-database';

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

// Additional cron endpoints can be added here

export const GET = handle(app);
