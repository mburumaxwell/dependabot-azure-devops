import {
  createApiServerApp,
  type DependabotCredential,
  type DependabotJobConfig,
  type DependabotRequest,
  type DependabotTokenType,
} from '@paklo/cli/dependabot';
import { handle } from 'hono/vercel';

export const dynamic = 'force-dynamic';

function authenticate(type: DependabotTokenType, id: number, value: string): Promise<boolean> {
  return Promise.resolve(false); // TODO: implement actual logic
}

function getJob(id: number): Promise<DependabotJobConfig | undefined> {
  return Promise.resolve(undefined); // TODO: implement actual logic
}

function getCredentials(id: number): Promise<DependabotCredential[] | undefined> {
  return Promise.resolve(undefined); // TODO: implement actual logic
}

function handleRequest(id: number, request: DependabotRequest): Promise<boolean> {
  return Promise.resolve(true); // TODO: implement actual logic
}

const app = createApiServerApp({
  basePath: '/api/update_jobs',
  authenticate,
  getJob,
  getCredentials,
  handle: handleRequest,
});

export const OPTIONS = handle(app);
export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
