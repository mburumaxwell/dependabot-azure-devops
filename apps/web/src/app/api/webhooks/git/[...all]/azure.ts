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
} from '@paklo/core/azure';
import { Hono } from 'hono';
import { basicAuth } from 'hono/basic-auth';
import { requestSync } from '@/actions/sync';
import { PakloId } from '@/lib/ids';
import { logger } from '@/lib/logger';
import { type Organization, type Project, prisma, type Repository } from '@/lib/prisma';

export const app = new Hono();

const authMiddleware = basicAuth({
  async verifyUser(username, password, context) {
    const organizationId = context.req.param('organizationId');
    if (!organizationId || !username || !password) {
      logger.trace('Missing username or password for Azdo webhook');
      return false;
    }

    // the username is the project id, the password is the webhookToken of the organization

    let id: PakloId;
    try {
      id = PakloId.parse(username);
    } catch {
      logger.trace(
        `Invalid username for Azdo webhook: '${username}'. It must be a valid Paklo ID for organization or project.`,
      );
      return false;
    }

    // ensure the type is project
    if (id.type !== 'project') {
      logger.trace(`Invalid username for Azdo webhook: '${username}'. It must be a valid Paklo project ID.`);
      return false;
    }

    // fetch the organization
    const organization = await prisma.organization.findFirst({ where: { id: organizationId } });
    if (!organization) {
      logger.trace(`No organization found for Azdo webhook with id: '${organizationId}'`);
      return false;
    }

    // fetch the project
    const project = await prisma.project.findFirst({ where: { id: username } });
    if (!project) {
      logger.trace(`No project found for Azdo webhook with id: '${username}'`);
      return false;
    }

    // ensure this is an azure organization
    if (organization.type !== 'azure') {
      logger.trace(`Organization for Azdo webhook with id: '${username}' is not of type 'azure'`);
      return false;
    }

    // fetch the organization's credential
    const credential = await prisma.organizationCredential.findFirstOrThrow({
      where: { id: organization.id },
    });

    // verify the password matches the webhookToken
    if (credential.webhooksToken !== password) {
      logger.trace(`Invalid password for Azdo webhook for organization id: '${username}'`);
      return false;
    }

    // store the organization and project in the context for later use
    context.set('organization', organization);
    context.set('project', project);

    return true;
  },
});

app.post(
  '/:organizationId',
  authMiddleware,
  zValidator('json', AzdoEventSchema),
  async (context): Promise<Response> => {
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
    if (eventType === 'git.push') {
      await handleCodePushEvent({ ...options, resource });
    } else if (eventType === 'git.pullrequest.updated') {
      await handlePrUpdatedEvent({ ...options, resource });
    } else if (eventType === 'git.pullrequest.merged') {
      await handlePrMergeEvent({ ...options, resource });
    } else if (eventType === 'git.repo.created') {
      await handleRepoCreatedEvent({ ...options, resource });
    } else if (eventType === 'git.repo.renamed') {
      await handleRepoRenamedEvent({ ...options, resource });
    } else if (eventType === 'git.repo.deleted') {
      await handleRepoDeletedEvent({ ...options, resource });
    } else if (eventType === 'git.repo.statuschanged') {
      await handleRepoStatusChangedEvent({ ...options, resource });
    } else if (eventType === 'ms.vss-code.git-pullrequest-comment-event') {
      await handleCommentEvent({ ...options, resource });
    }

    return context.body(null, 204);
  },
);

type HandlerOptions<T = unknown> = {
  organization: Organization;
  project: Project;
  repository?: Repository | null;
  resource: T;
};

async function handleCodePushEvent(options: HandlerOptions<AzdoEventCodePushResource>) {
  const {
    organization,
    project,
    repository,
    resource: {
      refUpdates,
      repository: { id: providerRepositoryId, remoteUrl, defaultBranch },
    },
  } = options;

  // ignore pushes to non-default branches
  if (defaultBranch && !refUpdates.some((ref) => ref.name.endsWith(defaultBranch))) {
    logger.trace(`Ignoring push event to non-default branch for repository ${remoteUrl} (default: ${defaultBranch})`);
    return;
  }

  // figure out if we need to trigger a sync
  const triggerSync = false;
  // get the push or check the commits for changes
  // the repository might not exist and if there are no changes to target files, no sync is needed
  // TODO: figure out how to do this

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
    resource: { repository: adoRepository, pullRequestId: prId, status },
  } = options;

  logger.debug(`PR ${prId} in ${adoRepository.remoteUrl} status updated to ${status}`);

  // TODO: handle the logic for merge conflicts here using events
}

async function handlePrMergeEvent(options: HandlerOptions<AzdoEventPullRequestResource>) {
  const { resource } = options;

  const { repository: adoRepository, pullRequestId: prId, status, mergeStatus } = resource;
  logger.debug(`PR ${prId} (${status}) in ${adoRepository.remoteUrl} merge status changed to ${mergeStatus}`);

  // TODO: handle the logic for updating other PRs to find merge conflicts (restart merge or attempt merge)
}

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

async function handleCommentEvent(options: HandlerOptions<AzdoEventPullRequestCommentEventResource>) {
  const {
    resource: {
      comment,
      pullRequest: { repository: adoRepository, pullRequestId: prId, status },
    },
  } = options;

  // ensure the comment starts with @dependabot
  const content = comment.content.trim();
  if (!content || !content.startsWith('@dependabot')) {
    return;
  }

  logger.debug(`PR ${prId} (${status}) in ${adoRepository.remoteUrl} was commented on: ${content}`);

  // TODO: handle the logic for comments here using events
}
