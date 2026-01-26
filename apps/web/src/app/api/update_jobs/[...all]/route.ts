import { buildPullRequestProperties, getPullRequestChangedFiles, PR_DESCRIPTION_MAX_LENGTH } from '@paklo/core/azure';
import {
  areEqual,
  createApiServerApp,
  type DependabotCredential,
  type DependabotJobConfig,
  type DependabotRequest,
  type DependabotTokenType,
  getBranchNameForUpdate,
  getDependencyNames,
  getPersistedPr,
  getPullRequestCloseReason,
  getPullRequestDescription,
  makeDirectoryKey,
  shouldSupersede,
} from '@paklo/core/dependabot';
import { toNextJsHandler } from '@paklo/core/hono';
import { resumeHook } from 'workflow/api';
import { createAzdoClient } from '@/actions/organizations';
import { author } from '@/lib/author';
import { logger } from '@/lib/logger';
import { getMongoCollection } from '@/lib/mongodb';
import {
  type Organization,
  type Project,
  prisma,
  type Repository,
  type RepositoryPullRequest,
  type RepositoryUpdate,
  type UpdateJob,
} from '@/lib/prisma';
import type { UpdateJobHookResult } from '@/workflows/jobs';

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
  return job ? job.jobConfig : undefined;
}

async function getCredentials(id: string): Promise<DependabotCredential[] | undefined> {
  const job = await prisma.updateJob.findUnique({ where: { id } });
  return job ? job.credentials : undefined;
}

async function handleRequest(id: string, request: DependabotRequest): Promise<boolean> {
  const job = await prisma.updateJob.findUnique({ where: { id } });
  if (!job) return false;

  // fetch related entities in parallel
  const [repositoryUpdate, repository, project, organization] = await Promise.all([
    prisma.repositoryUpdate.findUnique({
      where: { id: job.repositoryUpdateId },
    }),
    prisma.repository.findUnique({ where: { id: job.repositoryId } }),
    prisma.project.findUnique({ where: { id: job.projectId } }),
    prisma.organization.findUnique({ where: { id: job.organizationId } }),
  ]);
  if (!repositoryUpdate || !repository || !project || !organization) return false;

  const { type, data } = request;

  switch (type) {
    case 'create_pull_request':
    case 'update_pull_request':
    case 'close_pull_request': {
      return handlePrRequests({ request, repositoryUpdate, repository, project, organization, job });
    }

    case 'update_dependency_list': {
      const { dependency_files, dependencies } = data;
      const collection = await getMongoCollection('repository_update_dependencies');
      await collection.updateOne(
        { _id: repositoryUpdate.id },
        {
          $set: {
            ecosystem: repositoryUpdate.ecosystem,
            deps: dependencies?.map((d) => ({ name: d.name, version: d.version ?? undefined })) ?? [],
          },
        },
        { upsert: true },
      );
      await prisma.repositoryUpdate.update({
        where: { id: repositoryUpdate.id },
        data: { files: dependency_files ?? [] },
      });

      return true;
    }

    case 'mark_as_processed': {
      const secret = await prisma.updateJobSecret.findUniqueOrThrow({ where: { id: job.id } });
      await resumeHook<UpdateJobHookResult>(secret.hookToken!, { completed: true, finishedAt: new Date() });
      return true;
    }

    case 'record_update_job_warning': {
      const { warnings } = job;
      warnings.push({ ...data });
      await prisma.updateJob.update({ where: { id: job.id }, data: { warnings } });
      return true;
    }

    // Nothing to do for now
    case 'create_dependency_submission':
    case 'record_ecosystem_versions':
    case 'increment_metric':
    case 'record_ecosystem_meta':
    case 'record_cooldown_meta':
    case 'record_metrics': // from the runner
      return true;

    case 'record_update_job_error':
    case 'record_update_job_unknown_error': {
      const { errors } = job;
      errors.push({ ...data, unknown: type === 'record_update_job_unknown_error' });
      await prisma.updateJob.update({
        where: { id: job.id },
        data: { errors },
      });
      return true;
    }

    default:
      logger.warn(`Unknown dependabot request type '${type}', ignoring...`);
      return true;
  }
}

type HandlePrRequestsOptions = {
  organization: Organization;
  project: Project;
  repository: Repository;
  repositoryUpdate: Omit<RepositoryUpdate, 'deps'>;
  job: UpdateJob;
  request: Extract<DependabotRequest, { type: 'create_pull_request' | 'update_pull_request' | 'close_pull_request' }>;
};
async function handlePrRequests(options: HandlePrRequestsOptions): Promise<boolean> {
  const { organization, project, repository, repositoryUpdate, job, request } = options;
  if (organization.type !== 'azure') {
    logger.warn(`Received PR request for non-Azure organization (type: ${organization.type}), ignoring...`);
    return true;
  }

  // fetch existing pull requests for the repository and package manager
  const { packageManager } = job;
  const existingPullRequests = await prisma.repositoryPullRequest.findMany({
    where: { repositoryId: repository.id, packageManager },
  });

  const authorClient = await createAzdoClient({ organization }, true);
  const { jobConfig } = job;
  const { type, data } = request;
  const update = job.config.updates.find((u) => makeDirectoryKey(u) === repositoryUpdate.directoryKey)!;

  switch (type) {
    case 'create_pull_request': {
      const title = data['pr-title'];

      // skip if active pull request limit reached.
      const openPullRequestsLimit = update['open-pull-requests-limit']!;
      const hasReachedOpenPullRequestLimit =
        openPullRequestsLimit > 0 && existingPullRequests.length >= openPullRequestsLimit;
      if (hasReachedOpenPullRequestLimit) {
        logger.debug(
          `Skipping pull request creation of '${title}' as the open pull requests limit (${openPullRequestsLimit}) has been reached`,
        );
        return true;
      }

      const changedFiles = getPullRequestChangedFiles(data);
      const dependencies = getPersistedPr(data);
      const targetBranch =
        update['target-branch'] ||
        (await authorClient.getDefaultBranch({ project: project.name, repository: repository.name }));
      const sourceBranch = getBranchNameForUpdate({
        packageEcosystem: update['package-ecosystem'],
        targetBranchName: targetBranch,
        directory: update.directory || update.directories?.find((dir) => changedFiles[0]?.path?.startsWith(dir)),
        dependencyGroupName: !Array.isArray(dependencies) ? dependencies['dependency-group-name'] : undefined,
        dependencies: !Array.isArray(dependencies) ? dependencies.dependencies : dependencies,
        separator: update['pull-request-branch-name']?.separator,
      });

      // create a new pull request
      const newPullRequestId = await authorClient.createPullRequest({
        project: project.name,
        repository: repository.name,
        source: {
          commit: data['base-commit-sha'] || jobConfig.source.commit!,
          branch: sourceBranch,
        },
        target: {
          branch: targetBranch!,
        },
        author,
        title,
        description: getPullRequestDescription({
          packageManager,
          body: data['pr-body'],
          dependencies: data.dependencies,
          maxDescriptionLength: PR_DESCRIPTION_MAX_LENGTH,
        }),
        commitMessage: data['commit-message'],
        assignees: update.assignees,
        labels: update.labels?.map((label) => label?.trim()) || [],
        workItems: update.milestone ? [update.milestone] : [],
        changes: changedFiles,
        properties: buildPullRequestProperties(packageManager, dependencies),
      });

      if (newPullRequestId) {
        // if there are warnings on the job create PR comments with those warnings
        const { warnings } = job;
        for (const warning of warnings) {
          await authorClient.addCommentThread({
            project: project.name,
            repository: repository.name,
            content: `### Dependabot Warning: ${warning['warn-title']}\n\n${warning['warn-description']}`,
            pullRequestId: newPullRequestId,
          });
        }

        // record that this job affected the pull request
        await prisma.updateJob.update({
          where: { id: job.id },
          data: { affectedPrIds: { push: newPullRequestId } },
        });

        // create a new RepositoryPullRequest
        await prisma.repositoryPullRequest.create({
          data: {
            id: `${repository.id}-${packageManager}-${newPullRequestId}`,
            repositoryId: repository.id,
            packageManager,
            providerId: newPullRequestId,
            status: 'open',
            data: dependencies,
          },
        });

        // check if any existing pull requests are now superseded by this new pull request
        for (const existingPr of existingPullRequests) {
          if (shouldSupersede(dependencies, existingPr.data)) {
            logger.info(
              `Detected that existing PR #${existingPr.providerId} is superseded by new PR #${newPullRequestId}`,
            );
            await authorClient.abandonPullRequest({
              project: project.name,
              repository: repository.name,
              pullRequestId: existingPr.providerId,
              comment: `Superseded by #${newPullRequestId}`,
              deleteSourceBranch: true,
            });
          }
        }

        return true;
      }
      return false;
    }

    case 'update_pull_request': {
      // find the pull request to update
      const pullRequestToUpdate = getPullRequestForDependencyNames(
        existingPullRequests,
        packageManager,
        data['dependency-names'],
      );
      if (!pullRequestToUpdate) {
        logger.error(
          `Could not find pull request to update for package manager '${packageManager}' with dependencies '${data['dependency-names'].join(', ')}'`,
        );
        return false;
      }

      // update the pull request
      const pullRequestWasUpdated = await authorClient.updatePullRequest({
        project: project.name,
        repository: repository.name,
        pullRequestId: pullRequestToUpdate.providerId,
        commit: data['base-commit-sha'] || jobConfig.source.commit!,
        author,
        changes: getPullRequestChangedFiles(data),
      });

      if (pullRequestWasUpdated) {
        // record that this job affected the pull request
        await prisma.updateJob.update({
          where: { id: job.id },
          data: { affectedPrIds: { push: pullRequestToUpdate.providerId } },
        });

        return true;
      }
      return false;
    }

    case 'close_pull_request': {
      // Find the pull request to close
      const pullRequestToClose = getPullRequestForDependencyNames(
        existingPullRequests,
        packageManager,
        data['dependency-names'],
      );
      if (!pullRequestToClose) {
        logger.error(
          `Could not find pull request to close for package manager '${packageManager}' with dependencies '${data['dependency-names'].join(', ')}'`,
        );
        return false;
      }

      // close the pull request
      return await authorClient.abandonPullRequest({
        project: project.name,
        repository: repository.name,
        pullRequestId: pullRequestToClose.providerId,
        comment: getPullRequestCloseReason(data),
        deleteSourceBranch: true,
      });
    }
  }
}

function getPullRequestForDependencyNames(
  existingPullRequests: RepositoryPullRequest[],
  packageManager: string,
  dependencyNames: string[],
): RepositoryPullRequest | undefined {
  return existingPullRequests.find((pr) => {
    return pr.packageManager === packageManager && areEqual(getDependencyNames(pr.data), dependencyNames);
  });
}
