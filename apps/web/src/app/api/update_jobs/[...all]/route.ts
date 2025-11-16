import {
  createApiServerApp,
  type DependabotCredential,
  DependabotCredentialSchema,
  type DependabotJobConfig,
  DependabotJobConfigSchema,
  type DependabotRequest,
  type DependabotTokenType,
} from '@paklo/core/dependabot';
import { logger } from '@paklo/core/logger';
import { handle } from 'hono/vercel';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

async function authenticate(type: DependabotTokenType, id: string, value: string): Promise<boolean> {
  // if no secret found, authentication fails
  const secret = await prisma.updateJobSecret.findUnique({ where: { id } });
  if (!secret) return false;

  const token = type === 'job' ? secret.jobToken : secret.credentialsToken;
  return token === value;
}

async function getJob(id: string): Promise<DependabotJobConfig | undefined> {
  const job = await prisma.updateJob.findUnique({ where: { id } });
  if (!job) return undefined;

  const { data, success, error } = DependabotJobConfigSchema.safeParse(JSON.parse(job.configJson));
  if (!success) {
    logger.error(
      `
      Failed to parse DependabotJobConfig for job ID ${id}. This should not happen!
      \n${z.prettifyError(error)}
      `,
    );
    return undefined;
  }
  return data;
}

async function getCredentials(id: string): Promise<DependabotCredential[] | undefined> {
  const job = await prisma.updateJob.findUnique({ where: { id } });
  if (!job) return undefined;

  const { data, success, error } = DependabotCredentialSchema.array().safeParse(JSON.parse(job.credentialsJson));
  if (!success) {
    logger.error(
      `
      Failed to parse DependabotCredential for job ID ${id}. This should not happen!
      \n${z.prettifyError(error)}
      `,
    );
    return undefined;
  }
  return data;
}

function handleRequest(id: string, request: DependabotRequest): Promise<boolean> {
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
