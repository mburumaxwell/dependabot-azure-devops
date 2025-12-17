import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { AzdoEventSchema } from './events';

describe('notification types', () => {
  it('Parsing works for git.push', async () => {
    const event = await AzdoEventSchema.parseAsync(
      JSON.parse(await readFile('fixtures/azdo/notifications/git.push.json', 'utf-8')),
    );
    expect(event.subscriptionId).toBe('435e539d-3ce2-4283-8da9-8f3c0fe2e45e');
    expect(event.notificationId).toBe(3);
    expect(event.id).toBe('56e81d32-b0e8-44e2-a92a-55eb7b6ccdce');
    expect(event.eventType).toBe('git.push');
    expect(event.publisherId).toBe('tfs');
    expect(event.resourceVersion).toBe('1.0');
    expect(event.createdDate).toEqual(new Date('2020-12-23T05:47:19.8108134Z'));
    // ensure type narrowing
    if (event.eventType !== 'git.push') {
      throw new Error('Invalid event type');
    }
    expect(event.resource.refUpdates.length).toBe(1);
    expect(event.resource.refUpdates[0]!.name).toBe('refs/heads/main');
    expect(event.resource.refUpdates[0]!.oldObjectId).toBe('dd6ba920a4b4243162033737c0a1abbd937f4c40');
    expect(event.resource.refUpdates[0]!.newObjectId).toBe('b8a410b1b75ecb203fb5dda54adce2f9d2c87a27');
    expect(event.resource.pushId).toBe(34772);
    expect(event.resource.repository.id).toBe('d5bb1147-bd9f-4ae1-8554-aec3d164f94c');
    expect(event.resource.repository.name).toBe('dependabot-sample');
    expect(event.resource.repository.defaultBranch).toBe('refs/heads/main');
  });

  it('Parsing works for git.repo.created', async () => {
    const event = await AzdoEventSchema.parseAsync(
      JSON.parse(await readFile('fixtures/azdo/notifications/git.repo.created.json', 'utf-8')),
    );
    expect(event.subscriptionId).toBe('435e539d-3ce2-4283-8da9-8f3c0fe2e45e');
    expect(event.notificationId).toBe(3);
    expect(event.id).toBe('a0a0a0a0-bbbb-cccc-dddd-e1e1e1e1e1e1');
    expect(event.eventType).toBe('git.repo.created');
    expect(event.publisherId).toBe('tfs');
    expect(event.resourceVersion).toBe('1.0-preview.1');
    expect(event.createdDate).toEqual(new Date('2025-06-12T20:22:53.818Z'));
    // ensure type narrowing
    if (event.eventType !== 'git.repo.created') {
      throw new Error('Invalid event type');
    }
    expect(event.resource.repository.id).toBe('c2c2c2c2-dddd-eeee-ffff-a3a3a3a3a3a3');
    expect(event.resource.repository.name).toBe('Fabrikam-Fiber-Git');
  });

  it('Parsing works for git.repo.deleted', async () => {
    const event = await AzdoEventSchema.parseAsync(
      JSON.parse(await readFile('fixtures/azdo/notifications/git.repo.deleted.json', 'utf-8')),
    );
    expect(event.subscriptionId).toBe('435e539d-3ce2-4283-8da9-8f3c0fe2e45e');
    expect(event.notificationId).toBe(3);
    expect(event.id).toBe('a0a0a0a0-bbbb-cccc-dddd-e1e1e1e1e1e1');
    expect(event.eventType).toBe('git.repo.deleted');
    expect(event.publisherId).toBe('tfs');
    expect(event.resourceVersion).toBe('1.0-preview.1');
    expect(event.createdDate).toEqual(new Date('2025-06-12T20:33:32.512Z'));
    // ensure type narrowing
    if (event.eventType !== 'git.repo.deleted') {
      throw new Error('Invalid event type');
    }
    expect(event.resource.repositoryId).toBe('c2c2c2c2-dddd-eeee-ffff-a3a3a3a3a3a3');
    expect(event.resource.repositoryName).toBe('Fabrikam-Fiber-Git');
    expect(event.resource.isHardDelete).toBe(false);
  });

  it('Parsing works for git.repo.renamed', async () => {
    const event = await AzdoEventSchema.parseAsync(
      JSON.parse(await readFile('fixtures/azdo/notifications/git.repo.renamed.json', 'utf-8')),
    );
    expect(event.subscriptionId).toBe('435e539d-3ce2-4283-8da9-8f3c0fe2e45e');
    expect(event.notificationId).toBe(3);
    expect(event.id).toBe('a0a0a0a0-bbbb-cccc-dddd-e1e1e1e1e1e1');
    expect(event.eventType).toBe('git.repo.renamed');
    expect(event.publisherId).toBe('tfs');
    expect(event.resourceVersion).toBe('1.0-preview.1');
    expect(event.createdDate).toEqual(new Date('2025-06-12T20:48:38.859Z'));
    // ensure type narrowing
    if (event.eventType !== 'git.repo.renamed') {
      throw new Error('Invalid event type');
    }
    expect(event.resource.oldName).toBe('Diber-Git');
    expect(event.resource.newName).toBe('Fabrikam-Fiber-Git');
    expect(event.resource.repository.id).toBe('c2c2c2c2-dddd-eeee-ffff-a3a3a3a3a3a3');
    expect(event.resource.repository.name).toBe('Fabrikam-Fiber-Git');
  });

  it('Parsing works for git.repo.statuschanged', async () => {
    const event = await AzdoEventSchema.parseAsync(
      JSON.parse(await readFile('fixtures/azdo/notifications/git.repo.statuschanged.json', 'utf-8')),
    );
    expect(event.subscriptionId).toBe('435e539d-3ce2-4283-8da9-8f3c0fe2e45e');
    expect(event.notificationId).toBe(3);
    expect(event.id).toBe('a0a0a0a0-bbbb-cccc-dddd-e1e1e1e1e1e1');
    expect(event.eventType).toBe('git.repo.statuschanged');
    expect(event.publisherId).toBe('tfs');
    expect(event.resourceVersion).toBe('1.0-preview.1');
    expect(event.createdDate).toEqual(new Date('2025-06-12T20:55:07.812Z'));
    // ensure type narrowing
    if (event.eventType !== 'git.repo.statuschanged') {
      throw new Error('Invalid event type');
    }
    expect(event.resource.disabled).toBe(false);
    expect(event.resource.repository.id).toBe('c2c2c2c2-dddd-eeee-ffff-a3a3a3a3a3a3');
    expect(event.resource.repository.name).toBe('Fabrikam-Fiber-Git');
  });

  it('Parsing works for git.pullrequest.merged', async () => {
    const event = await AzdoEventSchema.parseAsync(
      JSON.parse(await readFile('fixtures/azdo/notifications/git.pullrequest.merged.json', 'utf-8')),
    );
    expect(event.subscriptionId).toBe('435e539d-3ce2-4283-8da9-8f3c0fe2e45e');
    expect(event.notificationId).toBe(3);
    expect(event.id).toBe('6872ee8c-b333-4eff-bfb9-0d5274943566');
    expect(event.eventType).toBe('git.pullrequest.merged');
    expect(event.publisherId).toBe('tfs');
    expect(event.resourceVersion).toBe('1.0');
    expect(event.createdDate).toEqual(new Date('2023-01-18T04:03:28.114Z'));
    // ensure type narrowing
    if (event.eventType !== 'git.pullrequest.merged') {
      throw new Error('Invalid event type');
    }
    expect(event.resource.pullRequestId).toBe(22568);
    expect(event.resource.status).toBe('completed');
    expect(event.resource.createdBy.id).toBe('961314fa-c312-68ab-8dce-cbb71e30c268');
    expect(event.resource.repository.id).toBe('d5bb1147-bd9f-4ae1-8554-aec3d164f94c');
    expect(event.resource.repository.name).toBe('dependabot-sample');
  });

  it('Parsing works for git.pullrequest.updated', async () => {
    const event = await AzdoEventSchema.parseAsync(
      JSON.parse(await readFile('fixtures/azdo/notifications/git.pullrequest.updated.json', 'utf-8')),
    );
    expect(event.subscriptionId).toBe('435e539d-3ce2-4283-8da9-8f3c0fe2e45e');
    expect(event.notificationId).toBe(3);
    expect(event.id).toBe('43236d01-b085-4739-80a6-153d305a902b');
    expect(event.eventType).toBe('git.pullrequest.updated');
    expect(event.publisherId).toBe('tfs');
    expect(event.resourceVersion).toBe('1.0');
    expect(event.createdDate).toEqual(new Date('2023-01-18T04:03:28.114Z'));
    // ensure type narrowing
    if (event.eventType !== 'git.pullrequest.updated') {
      throw new Error('Invalid event type');
    }
    expect(event.resource.pullRequestId).toBe(22568);
    expect(event.resource.status).toBe('completed');
    expect(event.resource.createdBy.id).toBe('961314fa-c312-68ab-8dce-cbb71e30c268');
    expect(event.resource.repository.id).toBe('d5bb1147-bd9f-4ae1-8554-aec3d164f94c');
    expect(event.resource.repository.name).toBe('dependabot-sample');
  });

  it('Parsing works for git-pullrequest-comment-event', async () => {
    const event = await AzdoEventSchema.parseAsync(
      JSON.parse(await readFile('fixtures/azdo/notifications/git-pullrequest-comment-event.json', 'utf-8')),
    );
    expect(event.subscriptionId).toBe('435e539d-3ce2-4283-8da9-8f3c0fe2e45e');
    expect(event.notificationId).toBe(3);
    expect(event.id).toBe('1e869c69-418c-4ef6-b2f1-ee95fcad149f');
    expect(event.eventType).toBe('ms.vss-code.git-pullrequest-comment-event');
    expect(event.publisherId).toBe('tfs');
    expect(event.resourceVersion).toBe('2.0');
    expect(event.createdDate).toEqual(new Date('2023-01-21T13:54:58.3779564Z'));
    // ensure type narrowing
    if (event.eventType !== 'ms.vss-code.git-pullrequest-comment-event') {
      throw new Error('Invalid event type');
    }
    expect(event.resource.comment.id).toBe(1);
    expect(event.resource.comment.parentCommentId).toBe(0);
    expect(event.resource.comment.content).toBe('Deployment to your Review App succeeded.');
    expect(event.resource.comment.commentType).toBe('text');
    expect(event.resource.comment.author.id).toBe('961314fa-c312-68ab-8dce-cbb71e30c268');
    expect(event.resource.comment.author.uniqueName).toBe('dependabot@tingle.software');
    expect(event.resource.comment.author.displayName).toBe('dependabot');
    expect(event.resource.pullRequest.pullRequestId).toBe(22568);
    expect(event.resource.pullRequest.status).toBe('completed');
    expect(event.resource.pullRequest.createdBy.id).toBe('961314fa-c312-68ab-8dce-cbb71e30c268');
    expect(event.resource.pullRequest.repository.id).toBe('d5bb1147-bd9f-4ae1-8554-aec3d164f94c');
    expect(event.resource.pullRequest.repository.name).toBe('dependabot-sample');
  });
});
