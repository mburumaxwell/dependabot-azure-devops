import { handle } from 'hono/vercel';

import { createApiServerApp, type DependabotRequest, type DependabotRequestHandleResult } from 'paklo/dependabot';

export const dynamic = 'force-dynamic';

function authenticate(id: number, value: string): Promise<boolean> {
  return Promise.resolve(false); // TODO: implement actual logic
}

function handleRequest(id: number, request: DependabotRequest): Promise<DependabotRequestHandleResult> {
  return undefined!; // TODO: implement actual logic
}

const app = createApiServerApp({
  basePath: '/api/update_jobs',
  authenticate,
  handle: handleRequest,
});

export const OPTIONS = handle(app);
export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
