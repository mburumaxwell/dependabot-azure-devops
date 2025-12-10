import { z } from 'zod';
import {
  AzdoGitCommitRefSchema,
  AzdoIdentityRefSchema,
  AzdoPullRequestAsyncStatusSchema,
  AzdoPullRequestCommentSchema,
  AzdoPullRequestStatusSchema,
} from './client/types';

export const AzdoEventTypeSchema = z.enum([
  // Code is pushed to a Git repository.
  'git.push',
  // Pull request is updated – status, review list, reviewer vote
  // changed or the source branch is updated with a push.
  'git.pullrequest.updated',
  // Pull request - Branch merge attempted.
  'git.pullrequest.merged',
  // A repository is created.
  'git.repo.created',
  // A repository is deleted.
  'git.repo.deleted',
  // A repository is renamed.
  'git.repo.renamed',
  // A repository's status is changed.
  'git.repo.statuschanged',
  // Comments are added to a pull request.
  'ms.vss-code.git-pullrequest-comment-event',
]);
export type AzdoEventType = z.infer<typeof AzdoEventTypeSchema>;

const AzdoEventProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
});

export const AzdoEventRepositorySchema = z.object({
  id: z.string(),
  name: z.string(),
  project: AzdoEventProjectSchema,
  defaultBranch: z.string().optional(),
  remoteUrl: z.string(),
});

export const AzdoEventCodePushResourceSchema = z.object({
  repository: AzdoEventRepositorySchema,
  commits: AzdoGitCommitRefSchema.array(),
  refUpdates: z
    .object({
      name: z.string(),
      oldObjectId: z.string().nullish(),
      newObjectId: z.string().nullish(),
    })
    .array(),
  pushId: z.number(),
  url: z.string(), // e.g. "https://dev.azure.com/fabrikam/_apis/git/repositories/2856c8c5-6f6b-4e6d-8a9f-4cf0d33f2f2a/pushes/22"
});
export type AzdoEventCodePushResource = z.infer<typeof AzdoEventCodePushResourceSchema>;

export const AzdoEventPullRequestResourceSchema = z.object({
  repository: AzdoEventRepositorySchema,
  pullRequestId: z.number(),
  status: AzdoPullRequestStatusSchema,
  createdBy: AzdoIdentityRefSchema,
  title: z.string(),
  sourceRefName: z.string(),
  targetRefName: z.string(),
  mergeStatus: AzdoPullRequestAsyncStatusSchema,
  mergeId: z.string(),
  url: z.string(),
});
export type AzdoEventPullRequestResource = z.infer<typeof AzdoEventPullRequestResourceSchema>;

export const AzdoEventRepositoryCreatedResourceSchema = z.object({
  repository: AzdoEventRepositorySchema,
});
export type AzdoEventRepositoryCreatedResource = z.infer<typeof AzdoEventRepositoryCreatedResourceSchema>;

export const AzdoEventRepositoryDeletedResourceSchema = z.object({
  project: AzdoEventProjectSchema,
  repositoryId: z.string(),
  repositoryName: z.string(),
  isHardDelete: z.boolean(),
});
export type AzdoEventRepositoryDeletedResource = z.infer<typeof AzdoEventRepositoryDeletedResourceSchema>;

export const AzdoEventRepositoryRenamedResourceSchema = z.object({
  oldName: z.string(),
  newName: z.string(),
  repository: AzdoEventRepositorySchema,
});
export type AzdoEventRepositoryRenamedResource = z.infer<typeof AzdoEventRepositoryRenamedResourceSchema>;

export const AzdoEventRepositoryStatusChangedResourceSchema = z.object({
  disabled: z.boolean(),
  repository: AzdoEventRepositorySchema,
});
export type AzdoEventRepositoryStatusChangedResource = z.infer<typeof AzdoEventRepositoryStatusChangedResourceSchema>;

export const AzdoEventPullRequestCommentEventResourceSchema = z.object({
  pullRequest: AzdoEventPullRequestResourceSchema,
  comment: AzdoPullRequestCommentSchema,
});
export type AzdoEventPullRequestCommentEventResource = z.infer<typeof AzdoEventPullRequestCommentEventResourceSchema>;

export const AzdoEventSchema = z
  .object({
    subscriptionId: z.string(),
    notificationId: z.number(),
    id: z.string(),
    publisherId: z.string(),
    resourceVersion: z.enum(['1.0', '1.0-preview.1', '2.0']),
    createdDate: z.coerce.date(),
  })
  .and(
    z.discriminatedUnion('eventType', [
      z.object({ eventType: z.literal('git.push'), resource: AzdoEventCodePushResourceSchema }),
      z.object({ eventType: z.literal('git.pullrequest.updated'), resource: AzdoEventPullRequestResourceSchema }),
      z.object({ eventType: z.literal('git.pullrequest.merged'), resource: AzdoEventPullRequestResourceSchema }),
      z.object({ eventType: z.literal('git.repo.created'), resource: AzdoEventRepositoryCreatedResourceSchema }),
      z.object({ eventType: z.literal('git.repo.deleted'), resource: AzdoEventRepositoryDeletedResourceSchema }),
      z.object({ eventType: z.literal('git.repo.renamed'), resource: AzdoEventRepositoryRenamedResourceSchema }),
      z.object({
        eventType: z.literal('git.repo.statuschanged'),
        resource: AzdoEventRepositoryStatusChangedResourceSchema,
      }),
      z.object({
        eventType: z.literal('ms.vss-code.git-pullrequest-comment-event'),
        resource: AzdoEventPullRequestCommentEventResourceSchema,
      }),
    ]),
  );
export type AzdoEvent = z.infer<typeof AzdoEventSchema>;
