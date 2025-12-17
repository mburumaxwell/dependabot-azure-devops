import { zValidator } from '@hono/zod-validator';
import {
  type AzdoEventCodePushResource,
  type AzdoEventPullRequestCommentEventResource,
  type AzdoEventPullRequestResource,
  type AzdoEventRepositoryCreatedResource,
  type AzdoEventRepositoryDeletedResource,
  type AzdoEventRepositoryRenamedResource,
  type AzdoEventRepositoryStatusChangedResource,
  AzdoEventSchema,
  type AzdoGitCommitDiffs,
} from '@paklo/core/azure';
import { CONFIG_FILE_PATHS_AZURE } from '@paklo/core/dependabot';
import { Hono } from 'hono';
import { bearerAuth } from 'hono/bearer-auth';
import { createAzdoClient } from '@/actions/organizations';
import { requestTriggerUpdateJobs } from '@/actions/repositories';
import { requestSync } from '@/actions/sync';
import { author } from '@/lib/author';
import { logger } from '@/lib/logger';
import { type Organization, type Project, prisma, type Repository } from '@/lib/prisma';
import { HEADER_NAME_ORGANIZATION, HEADER_NAME_PROJECT } from '@/lib/webhooks';

// https://hono.dev/docs/api/context#contextvariablemap
declare module 'hono' {
  interface ContextVariableMap {
    organization: Organization;
    project: Project;
  }
}

export const app = new Hono();

const authMiddleware = bearerAuth({
  async verifyToken(token, context) {
    const organizationId = context.req.header(HEADER_NAME_ORGANIZATION);
    const projectId = context.req.header(HEADER_NAME_PROJECT);
    if (!organizationId || !projectId || !token) {
      logger.trace('Missing required headers or token for webhook');
      return false;
    }

    // fetch the organization
    const organization = await prisma.organization.findFirst({ where: { id: organizationId } });
    if (!organization) {
      logger.trace(`No organization found for webhook with id: '${organizationId}'`);
      return false;
    }

    // ensure this is an azure organization
    if (organization.type !== 'azure') {
      logger.warn(`Organization for webhook with id: '${organization.id}' is not of type 'azure'`);
      return false;
    }

    // fetch the project
    const project = await prisma.project.findFirst({ where: { id: projectId } });
    if (!project) {
      logger.trace(`No project found for webhook with id: '${projectId}'`);
      return false;
    }

    // fetch the organization's credential
    const credential = await prisma.organizationCredential.findFirstOrThrow({
      where: { id: organization.id },
    });

    // verify the token matches the webhookToken
    if (credential.webhooksToken !== token) {
      logger.trace(`Invalid token for webhook for organization id: '${organizationId}'`);
      return false;
    }

    // store the organization and project in the context for later use
    context.set('organization', organization);
    context.set('project', project);

    return true;
  },
});

app.post('/', authMiddleware, zValidator('json', AzdoEventSchema), async (context): Promise<Response> => {
  // ensure organization is set in context
  const [organization, project] = [context.get('organization'), context.get('project')];
  if (!organization || !project) {
    logger.error('Organization or project not found in context for Azdo webhook which should not happen!');
    return context.body(null, 204); // indicate success to avoid Azure disabling the webhook
  }

  // get the validated event
  const event = context.req.valid('json');
  const { subscriptionId, notificationId, eventType, resource } = event;
  logger.debug(`Received ${eventType} notification ${notificationId} on subscription ${subscriptionId}`);

  // find the provider repository based on event type
  const providerRepositoryId: string | undefined = (() => {
    switch (eventType) {
      case 'git.pullrequest.updated':
      case 'git.pullrequest.merged':
      case 'git.push':
      case 'git.repo.created':
      case 'git.repo.renamed':
      case 'git.repo.statuschanged':
        return resource.repository.id;
      case 'git.repo.deleted':
        return resource.repositoryId;
      case 'ms.vss-code.git-pullrequest-comment-event':
        return resource.pullRequest.repository.id;
      default:
        return undefined;
    }
  })();
  if (!providerRepositoryId) {
    logger.error(`Could not determine provider repository for event type: '${eventType}' which should not happen.`);
    return context.body(null, 204); // indicate success to avoid Azure disabling the webhook
  }

  // fetch the repository exists (may not exist depending on event type)
  const repository = await prisma.repository.findFirst({
    where: { projectId: project.id, providerId: providerRepositoryId },
  });

  // handle the event types
  const options: HandlerOptions = { organization, project, repository, resource };
  if (eventType === 'git.repo.created') {
    await handleRepoCreatedEvent({ ...options, resource });
  } else if (eventType === 'git.repo.renamed') {
    await handleRepoRenamedEvent({ ...options, resource });
  } else if (eventType === 'git.repo.deleted') {
    await handleRepoDeletedEvent({ ...options, resource });
  } else if (eventType === 'git.repo.statuschanged') {
    await handleRepoStatusChangedEvent({ ...options, resource });
  } else if (eventType === 'git.push') {
    await handleCodePushEvent({ ...options, resource });
  } else if (eventType === 'git.pullrequest.updated') {
    await handlePrUpdatedEvent({ ...options, resource });
  } else if (eventType === 'git.pullrequest.merged') {
    await handlePrMergeEvent({ ...options, resource });
  } else if (eventType === 'ms.vss-code.git-pullrequest-comment-event') {
    await handleCommentEvent({ ...options, resource });
  }

  return context.body(null, 204);
});

type HandlerOptions<T = unknown> = {
  organization: Organization;
  project: Project;
  repository?: Repository | null;
  resource: T;
};

async function handleRepoCreatedEvent(options: HandlerOptions<AzdoEventRepositoryCreatedResource>) {
  const { organization, project, resource } = options;

  // we need to do sync for that repository so that it is created
  // sometimes is is created as a clone from another Git URL
  await requestSync({
    organizationId: organization.id,
    projectId: project.id,
    repositoryId: undefined, // does not exist yet
    repositoryProviderId: resource.repository.id,
    scope: 'repository',
    trigger: false, // do not trigger update jobs
  });
}

async function handleRepoRenamedEvent(options: HandlerOptions<AzdoEventRepositoryRenamedResource>) {
  const { repository, resource } = options;

  // nothing to do if the repository does not exist on our end
  if (!repository) return;

  // update the repository name
  await prisma.repository.update({
    where: { id: repository.id },
    data: { name: resource.newName },
  });
}

async function handleRepoDeletedEvent(options: HandlerOptions<AzdoEventRepositoryDeletedResource>) {
  const { repository } = options;

  // nothing to do if the repository has been deleted or we did not have it registered
  if (!repository) return;

  // fairly simple here, just delete the repository from our database
  await prisma.repository.delete({ where: { id: repository.id } });
}

async function handleRepoStatusChangedEvent(options: HandlerOptions<AzdoEventRepositoryStatusChangedResource>) {
  const { organization, project, repository, resource } = options;

  // if disabled, we delete the repository
  if (resource.disabled && repository) {
    await prisma.repository.delete({ where: { id: repository.id } });
    return;
  }

  // at this point not disabled

  // we need to do sync for that repository so that it is created
  await requestSync({
    organizationId: organization.id,
    projectId: project.id,
    repositoryId: undefined, // does not exist yet
    repositoryProviderId: resource.repository.id,
    scope: 'repository',
    trigger: false, // do not trigger update jobs
  });
}

async function handleCodePushEvent(options: HandlerOptions<AzdoEventCodePushResource>) {
  const {
    organization,
    project,
    repository,
    resource: {
      refUpdates,
      pushId,
      repository: { id: providerRepositoryId, remoteUrl, defaultBranch },
    },
  } = options;

  // ignore pushes to non-default branches
  if (!defaultBranch || !refUpdates.some((ref) => ref.name.endsWith(defaultBranch))) {
    logger.trace(`Ignoring push event to non-default branch for repository ${remoteUrl} (default: ${defaultBranch})`);
    return;
  }

  // fetch the push details from Azure DevOps
  const targetRefUpdate = refUpdates.find((ref) => ref.name.endsWith(defaultBranch))!;
  const client = await createAzdoClient({ organization });
  let diffs: AzdoGitCommitDiffs;
  try {
    diffs = await client.git.getDiffCommits(
      project.name,
      repository ? repository.name : providerRepositoryId,
      targetRefUpdate.oldObjectId!,
      targetRefUpdate.newObjectId!,
    );
  } catch (e) {
    logger.error(`Failed to fetch push ${pushId} for repository ${remoteUrl}: ${(e as Error).message}`);
    return;
  }

  // find the changed files in the push hence determine if we need to trigger a sync
  const paths = Array.from(
    new Set(
      (diffs.changes ?? []).flatMap((change) => [change.originalPath, change.item?.path].filter(Boolean) as string[]),
    ).values(),
  );
  const triggerSync = paths.some((p) => CONFIG_FILE_PATHS_AZURE.some((cp) => p.endsWith(cp)));

  // trigger sync
  if (!triggerSync) {
    logger.debug(`No relevant changes in push to ${remoteUrl}`);
    return;
  }

  // trigger sync for the repository
  logger.debug(`Triggering sync for repository ${remoteUrl} due to push event`);
  await requestSync({
    organizationId: organization.id,
    projectId: project.id,
    repositoryId: repository?.id,
    repositoryProviderId: repository ? undefined : providerRepositoryId,
    scope: 'repository',
    trigger: true, // trigger update jobs
  });
}

async function handlePrUpdatedEvent(options: HandlerOptions<AzdoEventPullRequestResource>) {
  const {
    repository,
    resource: { repository: adoRepository, pullRequestId: prId, status },
  } = options;

  logger.debug(`PR ${prId} in ${adoRepository.remoteUrl} status updated to ${status}`);

  // fetch the pull request from our database
  const pullRequest = await prisma.repositoryPullRequest.findFirst({
    where: { repositoryId: repository!.id, providerId: prId },
  });
  if (!pullRequest) {
    logger.trace(`PR ${prId} in ${adoRepository.remoteUrl} not found in database on update event`);
    return;
  }

  // skip if the PR is not open
  if (pullRequest.status !== 'open') {
    logger.trace(`PR ${prId} in ${adoRepository.remoteUrl} is not open in database on update event`);
    return;
  }

  // if abandoned, update the PR status to closed
  if (status === 'abandoned') {
    await prisma.repositoryPullRequest.update({
      where: { id: pullRequest.id },
      data: { status: 'closed' },
    });
    return;
  }
}

async function handlePrMergeEvent(options: HandlerOptions<AzdoEventPullRequestResource>) {
  const { organization, project, repository, resource } = options;

  const { repository: adoRepository, pullRequestId: prId, status, mergeStatus } = resource;
  logger.debug(`PR ${prId} (${status}) in ${adoRepository.remoteUrl} merge status changed to ${mergeStatus}`);

  // fetch the pull request from our database
  const pullRequest = await prisma.repositoryPullRequest.findFirst({
    where: { repositoryId: repository!.id, providerId: prId },
  });
  if (!pullRequest) {
    logger.trace(`PR ${prId} in ${adoRepository.remoteUrl} not found in database on merge event`);
    return;
  }

  // skip if the PR is not open
  if (pullRequest.status !== 'open') {
    logger.trace(`PR ${prId} in ${adoRepository.remoteUrl} is not open in database on merge event`);
    return;
  }

  // if merged successfully, update the PR status to merged
  if (mergeStatus === 'succeeded') {
    await prisma.repositoryPullRequest.update({
      where: { id: pullRequest.id },
      data: { status: 'merged' },
    });
    return;
  }

  // if there are merge conflicts, trigger a job to handle them
  if (mergeStatus === 'conflicts') {
    // skip if the pull request has been modified by another author
    const client = await createAzdoClient({ organization });
    const commits = await client.pullRequests.getCommits(project.name, repository!.name, prId);
    if (commits?.some((c) => c.author?.email !== author.email)) {
      logger.trace(
        `PR ${prId} in ${adoRepository.remoteUrl} has been modified by another author, skipping conflict handling`,
      );
      return;
    }

    // request trigger update job to handle merge conflicts for this PR
    logger.trace(`PR ${prId} in ${adoRepository.remoteUrl} has merge conflicts, handling them`);
    await requestTriggerUpdateJobs({
      organizationId: organization.id,
      projectId: project.id,
      repositoryId: repository!.id,
      repositoryPullRequestId: pullRequest.id,
      trigger: 'conflicts',
    });
    return;
  }
}

async function handleCommentEvent(options: HandlerOptions<AzdoEventPullRequestCommentEventResource>) {
  const {
    organization,
    project,
    repository,
    resource: {
      comment,
      pullRequest: { repository: adoRepository, pullRequestId: prId },
    },
  } = options;

  // fetch the pull request from our database
  const pullRequest = await prisma.repositoryPullRequest.findFirst({
    where: { repositoryId: repository!.id, providerId: prId },
  });
  if (!pullRequest) {
    logger.trace(`PR ${prId} in ${adoRepository.remoteUrl} not found in database on comment event`);
    return;
  }

  // skip if the PR is not open
  if (pullRequest.status !== 'open') {
    logger.trace(`PR ${prId} in ${adoRepository.remoteUrl} is not open in database on comment event`);
    return;
  }

  // ensure the comment matches the format we expect i.e. "@dependabot <rebase|recreate>"
  const content = comment.content.trim();
  const commentFormat = /^@dependabot\s+(rebase|recreate)$/i;
  if (!content || !commentFormat.test(content)) {
    return;
  }

  const command = content.match(commentFormat)![1]!.toLowerCase() as 'rebase' | 'recreate';
  logger.debug(`PR ${prId} in ${adoRepository.remoteUrl} was commented on with command: ${command}`);

  if (command === 'recreate') {
    logger.debug(`Recreating PR ${prId} in ${adoRepository.remoteUrl} as per comment command`);
    await requestTriggerUpdateJobs({
      organizationId: options.organization.id,
      projectId: options.project.id,
      repositoryId: repository!.id,
      repositoryPullRequestId: pullRequest.id,
      trigger: 'comment',
    });
  } else if (command === 'rebase') {
    // comment that there are additional commits if the pull request has been modified by another author
    const client = await createAzdoClient({ organization }, true);
    const commits = await client.inner.pullRequests.getCommits(project.name, repository!.name, prId);
    if (commits?.some((c) => c.author?.email !== author.email)) {
      // post comment that there are additional commits and they should use recreate instead
      await client.addCommentThread({
        project: project.name,
        repository: repository!.providerId,
        pullRequestId: prId,
        content:
          'Cannot rebase this pull request as it has been modified by other authors. Please use `@dependabot recreate` to recreate the pull request which will override additional commits.',
      });
      return;
    }

    // request trigger update job to handle the rebase for this PR
    logger.trace(`PR ${prId} in ${adoRepository.remoteUrl} is being rebased as per comment command`);
    await requestTriggerUpdateJobs({
      organizationId: options.organization.id,
      projectId: options.project.id,
      repositoryId: repository!.id,
      repositoryPullRequestId: pullRequest.id,
      trigger: 'comment',
    });
  }
}
