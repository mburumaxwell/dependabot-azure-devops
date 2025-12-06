import { z } from 'zod';

export const AzdoVersionControlChangeTypeSchema = z.enum([
  'none',
  'add',
  'edit',
  'encoding',
  'rename',
  'delete',
  'undelete',
  'branch',
  'merge',
  'lock',
  'rollback',
  'sourceRename',
  'targetRename',
  'property',
  'all',
]);
export type AzdoVersionControlChangeType = z.infer<typeof AzdoVersionControlChangeTypeSchema>;

export const AZDO_PULL_REQUEST_MERGE_STRATEGIES = ['noFastForward', 'squash', 'rebase', 'rebaseMerge'] as const;
export const AzdoPullRequestMergeStrategySchema = z.enum(AZDO_PULL_REQUEST_MERGE_STRATEGIES);
export type AzdoPullRequestMergeStrategy = z.infer<typeof AzdoPullRequestMergeStrategySchema>;

export const AzdoCommentThreadStatusSchema = z.enum([
  'unknown',
  'active',
  'fixed',
  'wontFix',
  'closed',
  'byDesign',
  'pending',
]);
export type AzdoCommentThreadStatus = z.infer<typeof AzdoCommentThreadStatusSchema>;
export const AzdoCommentTypeSchema = z.enum(['unknown', 'text', 'codeChange', 'system']);
export type AzdoCommentType = z.infer<typeof AzdoCommentTypeSchema>;

export const AzdoPullRequestAsyncStatusSchema = z.enum([
  'notSet',
  'queued',
  'conflicts',
  'succeeded',
  'rejectedByPolicy',
  'failure',
]);
export type AzdoPullRequestAsyncStatus = z.infer<typeof AzdoPullRequestAsyncStatusSchema>;
export const AzdoPullRequestStatusSchema = z.enum(['notSet', 'active', 'abandoned', 'completed', 'all']);
export type AzdoPullRequestStatus = z.infer<typeof AzdoPullRequestStatusSchema>;

export const AzdoProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  url: z.string(),
  state: z.enum(['deleting', 'new', 'wellFormed', 'createPending', 'all', 'unchanged', 'deleted']),
  _links: z
    .object({
      self: z.object({ href: z.string() }),
      collection: z.object({ href: z.string() }),
      web: z.object({ href: z.string() }),
    })
    .optional(),
});
export type AzdoProject = z.infer<typeof AzdoProjectSchema>;

export const AzdoRepositorySchema = z.object({
  id: z.string(),
  name: z.string(),
  defaultBranch: z.string().optional(),
  project: AzdoProjectSchema,
  isDisabled: z.boolean().optional(),
  isFork: z.boolean().optional(),
  url: z.string(),
  remoteUrl: z.string(),
  webUrl: z.string(),
});
export type AzdoRepository = z.infer<typeof AzdoRepositorySchema>;

export type AzdoListResponse<T> = {
  value?: T;
  count: number;
};

export const AzdoIdentitySchema = z.object({
  id: z.string(),
  displayName: z.string(),
  url: z.string(),
});
export type AzdoIdentity = z.infer<typeof AzdoIdentitySchema>;
export const AzdoIdentityRefSchema = z.object({
  id: z.string().optional(),
  displayName: z.string().optional(),
  url: z.string().optional(),
});
export type AzdoIdentityRef = z.infer<typeof AzdoIdentityRefSchema>;

export const AzdoConnectionDataSchema = z.object({
  authenticatedUser: AzdoIdentitySchema,
  authorizedUser: AzdoIdentitySchema,
});
export type AzdoConnectionData = z.infer<typeof AzdoConnectionDataSchema>;

export const AzdoGitUserDateSchema = z.object({
  name: z.string(),
  email: z.string(),
  date: z.string().optional(),
});
export type AzdoGitUserDate = z.infer<typeof AzdoGitUserDateSchema>;
export const AzdoGitRefSchema = z.object({
  name: z.string(),
  objectId: z.string(),
  isLocked: z.boolean().optional(),
});
export type AzdoGitRef = z.infer<typeof AzdoGitRefSchema>;
export const AzdoGitRefUpdateResultSchema = AzdoGitRefSchema.extend({
  oldObjectId: z.string(),
  newObjectId: z.string(),
  success: z.boolean(),
  customMessage: z.string().optional(),
});
export type AzdoGitRefUpdateResult = z.infer<typeof AzdoGitRefUpdateResultSchema>;
export const AzdoGitChangeSchema = z.object({
  changeType: AzdoVersionControlChangeTypeSchema,
  newContent: z
    .object({
      content: z.string(),
      contentType: z.enum(['rawtext', 'base64encoded']),
    })
    .optional(),
});
export type AzdoGitChange = z.infer<typeof AzdoGitChangeSchema>;
export const AzdoGitCommitRefSchema = z.object({
  commitId: z.string().optional(),
  author: AzdoGitUserDateSchema.optional(),
  committer: AzdoGitUserDateSchema.optional(),
  changes: AzdoGitChangeSchema.array(),
});
export type AzdoGitCommitRef = z.infer<typeof AzdoGitCommitRefSchema>;
export const AzdoGitPushSchema = z.object({
  commits: AzdoGitCommitRefSchema.array(),
  refUpdates: AzdoGitRefSchema.array(),
});
export type AzdoGitPush = z.infer<typeof AzdoGitPushSchema>;
export const AzdoGitPushCreateSchema = z.object({
  refUpdates: z
    .object({
      name: z.string(),
      oldObjectId: z.string(),
      newObjectId: z.string().optional(),
    })
    .array(),
  commits: z
    .object({
      comment: z.string(),
      author: AzdoGitUserDateSchema.optional(),
      changes: AzdoGitChangeSchema.extend({
        item: z.object({ path: z.string() }),
      }).array(),
    })
    .array(),
});
export type AzdoGitPushCreate = z.infer<typeof AzdoGitPushCreateSchema>;
export const AzdoGitBranchStatsSchema = z.object({
  aheadCount: z.number(),
  behindCount: z.number(),
});
export type AzdoGitBranchStats = z.infer<typeof AzdoGitBranchStatsSchema>;

export const AzdoRepositoryItemSchema = z.object({
  latestProcessedChange: AzdoGitCommitRefSchema.optional(),
  content: z.string().optional(),
});
export type AzdoRepositoryItem = z.infer<typeof AzdoRepositoryItemSchema>;

export const AzdoPullRequestSchema = z.object({
  pullRequestId: z.number(),
  status: AzdoPullRequestStatusSchema,
  isDraft: z.boolean(),
  sourceRefName: z.string(),
  targetRefName: z.string(),
  lastMergeCommit: AzdoGitCommitRefSchema,
  lastMergeSourceCommit: AzdoGitCommitRefSchema,
  mergeStatus: AzdoPullRequestAsyncStatusSchema,
  autoCompleteSetBy: AzdoIdentityRefSchema.optional(),
  closedBy: AzdoIdentityRefSchema.optional(),
});
export type AzdoPullRequest = z.infer<typeof AzdoPullRequestSchema>;

export const AdoPropertiesSchema = z.record(
  z.string(),
  z.object({
    $type: z.string(),
    $value: z.string(),
  }),
);
export type AdoProperties = z.infer<typeof AdoPropertiesSchema>;

export const AzdoIdentityRefWithVoteSchema = z.object({
  id: z.string().optional(),
  displayName: z.string().optional(),
  vote: z.number().optional(),
  hasDeclined: z.boolean().optional(),
  isFlagged: z.boolean().optional(),
  isRequired: z.boolean().optional(),
});
export type AzdoIdentityRefWithVote = z.infer<typeof AzdoIdentityRefWithVoteSchema>;

export const AzdoPullRequestCommentSchema = z.object({
  id: z.number(),
  parentCommentId: z.number().nullable(),
  content: z.string(),
  commentType: AzdoCommentTypeSchema,
  publishedDate: z.string(),
  author: AzdoIdentityRefSchema.optional(),
});
export type AzdoPullRequestComment = z.infer<typeof AzdoPullRequestCommentSchema>;
export const AzdoPullRequestCommentThreadSchema = z.object({
  id: z.number(),
  comments: AzdoPullRequestCommentSchema.array(),
  status: AzdoCommentThreadStatusSchema,
});
export type AzdoPullRequestCommentThread = z.infer<typeof AzdoPullRequestCommentThreadSchema>;

export const AzdoSubscriptionSchema = z.object({
  id: z.string().optional(),
  status: z.enum(['enabled', 'onProbation', 'disabledByUser', 'disabledBySystem', 'disabledByInactiveIdentity']),
  publisherId: z.string(),
  publisherInputs: z.record(z.string(), z.string()),
  consumerId: z.string().optional(),
  consumerActionId: z.string().optional(),
  consumerInputs: z.record(z.string(), z.string()),
  eventType: z.string(), // not enum because we do not know all the values
  resourceVersion: z.string(),
  eventDescription: z.string().optional(),
  actionDescription: z.string().optional(),
});
export type AzdoSubscription = z.infer<typeof AzdoSubscriptionSchema>;

export const AzdoSubscriptionsQueryResponseSchema = z.object({
  results: AzdoSubscriptionSchema.array(),
});
export type AzdoSubscriptionsQueryResponse = z.infer<typeof AzdoSubscriptionsQueryResponseSchema>;

export const AzdoSubscriptionsQueryInputFilterSchema = z.object({
  conditions: z
    .object({
      caseSensitive: z.boolean().optional(),
      inputId: z.string().optional(),
      inputValue: z.string().optional(),
      operator: z.enum(['equals', 'notEquals']),
    })
    .array()
    .optional(),
});
export type AzdoSubscriptionsQueryInputFilter = z.infer<typeof AzdoSubscriptionsQueryInputFilterSchema>;

export const AzdoSubscriptionsQuerySchema = z.object({
  consumerActionId: z.string().optional(),
  consumerId: z.string().optional(),
  consumerInputFilters: AzdoSubscriptionsQueryInputFilterSchema.array().optional(),
  eventType: z.string().optional(),
  publisherId: z.string().optional(),
  publisherInputFilters: AzdoSubscriptionsQueryInputFilterSchema.array().optional(),
  subscriberId: z.string().optional(),
});
export type AzdoSubscriptionsQuery = z.infer<typeof AzdoSubscriptionsQuerySchema>;

export const AzdoEventTypeSchema = z.enum([
  // Code is pushed to a Git repository.
  'git.push',
  // Pull request is updated – status, review list, reviewer vote
  // changed or the source branch is updated with a push.
  'git.pullrequest.updated',
  // Pull request - Branch merge attempted.
  'git.pullrequest.merged',
  // Comments are added to a pull request.
  'ms.vss-code.git-pullrequest-comment-event',
]);
export type AzdoEventType = z.infer<typeof AzdoEventTypeSchema>;

export const AzdoEventRepositorySchema = z.object({
  id: z.string(),
  name: z.string(),
  project: z.object({
    id: z.string(),
    name: z.string(),
    url: z.string(),
  }),
  defaultBranch: z.string().optional(),
  remoteUrl: z.string(),
});
export const AzdoEventPullRequestResourceSchema = z.object({
  repository: AzdoEventRepositorySchema,
  pullRequestId: z.number(),
  status: AzdoPullRequestStatusSchema,
  title: z.string(),
  sourceRefName: z.string(),
  targetRefName: z.string(),
  mergeStatus: AzdoPullRequestAsyncStatusSchema,
  mergeId: z.string(),
  url: z.string(),
});
export type AzdoEventPullRequestResource = z.infer<typeof AzdoEventPullRequestResourceSchema>;
export const AzdoEventPullRequestCommentEventResourceSchema = z.object({
  pullRequest: AzdoEventPullRequestResourceSchema,
  comment: AzdoPullRequestCommentSchema,
});
export type AzdoEventPullRequestCommentEventResource = z.infer<typeof AzdoEventPullRequestCommentEventResourceSchema>;
export const AzdoEventCodePushResourceSchema = z.object({
  repository: AzdoEventRepositorySchema,
  refUpdates: z
    .object({
      name: z.string(),
      oldObjectId: z.string().nullish(),
      newObjectId: z.string().nullish(),
    })
    .array(),
});
export type AzdoEventCodePushResource = z.infer<typeof AzdoEventCodePushResourceSchema>;
export const AzdoEventSchema = z.object({ subscriptionId: z.string(), notificationId: z.number() }).and(
  z.discriminatedUnion('eventType', [
    z.object({ eventType: z.literal('git.push'), resource: AzdoEventCodePushResourceSchema }),
    z.object({ eventType: z.literal('git.pullrequest.updated'), resource: AzdoEventPullRequestResourceSchema }),
    z.object({ eventType: z.literal('git.pullrequest.merged'), resource: AzdoEventPullRequestResourceSchema }),
    z.object({
      eventType: z.literal('ms.vss-code.git-pullrequest-comment-event'),
      resource: AzdoEventPullRequestCommentEventResourceSchema,
    }),
  ]),
);
export type AzdoEvent = z.infer<typeof AzdoEventSchema>;
