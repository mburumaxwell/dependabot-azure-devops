import {
  createApiServerApp,
  type DependabotCredential,
  DependabotCredentialSchema,
  type DependabotJobConfig,
  DependabotJobConfigSchema,
  type DependabotRequest,
  type DependabotTokenType,
} from '@paklo/core/dependabot';
import { toNextJsHandler } from '@paklo/core/hono';
import { logger } from '@paklo/core/logger';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const app = createApiServerApp({
  basePath: '/api/update_jobs',
  authenticate,
  getJob,
  getCredentials,
  handle: handleRequest,
});

export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = toNextJsHandler(app);

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

  const { data, success, error } = DependabotJobConfigSchema.safeParse(JSON.parse(job.config));
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

  const { data, success, error } = DependabotCredentialSchema.array().safeParse(JSON.parse(job.credentials));
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

async function handleRequest(id: string, request: DependabotRequest): Promise<boolean> {
  const job = await prisma.updateJob.findUnique({ where: { id } });
  if (!job) return false;

  // fetch related entities in parallel
  const [repositoryUpdate, repository, project, organization] = await Promise.all([
    prisma.repositoryUpdate.findUnique({ where: { id: job.repositoryUpdateId } }),
    prisma.repository.findUnique({ where: { id: job.repositoryId } }),
    prisma.project.findUnique({ where: { id: job.projectId } }),
    prisma.organization.findUnique({ where: { id: job.organizationId } }),
  ]);
  if (!repositoryUpdate || !repository || !project || !organization) return false;

  const { type, data } = request;

  switch (type) {
    // TODO: implement actual logic
    case 'create_pull_request':
    case 'update_pull_request':
    case 'close_pull_request':
    case 'create_dependency_submission': // can be used for SBOM or checking vulnerabilities
    case 'record_update_job_warning': {
      return true;
    }

    case 'update_dependency_list': {
      const { dependency_files } = data;
      await prisma.repositoryUpdate.update({
        where: { id: repositoryUpdate.id },
        data: { files: dependency_files ?? [] },
      });

      // TODO: store dependencies as we need them to pull security advisories later

      return true;
    }

    // Nothing to do for now
    case 'mark_as_processed':
    case 'record_ecosystem_versions':
    case 'increment_metric':
    case 'record_ecosystem_meta':
    case 'record_cooldown_meta':
    case 'record_metrics': // from the runner
      return true;

    case 'record_update_job_error':
    case 'record_update_job_unknown_error': {
      const { 'error-type': errorType, 'error-details': errorDetails } = data;
      await prisma.updateJob.update({
        where: { id: job.id },
        data: {
          errorType,
          errorDetails: errorDetails ? JSON.stringify(errorDetails) : undefined,
        },
      });
      return true;
    }

    default:
      logger.warn(`Unknown dependabot request type '${type}', ignoring...`);
      return true;
  }
}
