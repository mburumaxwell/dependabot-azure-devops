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

export type AzdoResponse<T> = {
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
  uniqueName: z.string().optional(),
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
  item: z.string().optional(), // current version (path)
  newContent: z
    .object({
      content: z.string(),
      contentType: z.enum(['rawtext', 'base64encoded']),
    })
    .optional(),
  originalPath: z.string().optional(), // original path of the item if different from current path
});
export type AzdoGitChange = z.infer<typeof AzdoGitChangeSchema>;
export const AzdoGitCommitRefSchema = z.object({
  commitId: z.string(),
  author: AzdoGitUserDateSchema.optional(),
  committer: AzdoGitUserDateSchema.optional(),
  changes: AzdoGitChangeSchema.array().optional(),
});
export type AzdoGitCommitRef = z.infer<typeof AzdoGitCommitRefSchema>;
export const AzdoGitPushSchema = z.object({
  commits: AzdoGitCommitRefSchema.array(),
  refUpdates: AzdoGitRefSchema.array(),
});
export type AzdoGitPush = z.infer<typeof AzdoGitPushSchema>;
export const AzdoGitRefUpdateSchema = z.object({
  name: z.string(),
  oldObjectId: z.string(),
  newObjectId: z.string().optional(),
  isLocked: z.boolean().optional(),
});
export type AzdoGitRefUpdate = z.infer<typeof AzdoGitRefUpdateSchema>;
export const AzdoGitPushCreateSchema = z.object({
  refUpdates: AzdoGitRefUpdateSchema.array(),
  commits: z
    .object({
      comment: z.string(),
      author: AzdoGitUserDateSchema.optional(),
      changes: AzdoGitChangeSchema.omit({ item: true })
        .extend({ item: z.object({ path: z.string() }) })
        .array(),
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

export const AzdoIdentityRefWithVoteSchema = z.object({
  id: z.string().optional(),
  displayName: z.string().optional(),
  vote: z.number().optional(),
  hasDeclined: z.boolean().optional(),
  isFlagged: z.boolean().optional(),
  isRequired: z.boolean().optional(),
});
export type AzdoIdentityRefWithVote = z.infer<typeof AzdoIdentityRefWithVoteSchema>;

export const AzdoPullRequestSchema = z.object({
  pullRequestId: z.number(),
  status: AzdoPullRequestStatusSchema,
  isDraft: z.boolean(),
  sourceRefName: z.string(),
  targetRefName: z.string(),
  title: z.string(),
  description: z.string().optional(),
  lastMergeCommit: AzdoGitCommitRefSchema,
  lastMergeSourceCommit: AzdoGitCommitRefSchema,
  mergeStatus: AzdoPullRequestAsyncStatusSchema,
  reviewers: AzdoIdentityRefWithVoteSchema.array().optional(),
  workItemRefs: z.object({ id: z.string() }).array().optional(),
  labels: z.object({ name: z.string() }).array().optional(),
  autoCompleteSetBy: AzdoIdentityRefSchema.optional(),
  completionOptions: z
    .object({
      autoCompleteIgnoreConfigIds: z.number().array().optional(),
      deleteSourceBranch: z.boolean().optional(),
      mergeCommitMessage: z.string().optional(),
      mergeStrategy: AzdoPullRequestMergeStrategySchema.optional(),
      transitionWorkItems: z.boolean().optional(),
    })
    .optional(),
  closedBy: AzdoIdentityRefSchema.optional(),
});
export type AzdoPullRequest = z.infer<typeof AzdoPullRequestSchema>;

export const AzdoPropertiesSchema = z.record(
  z.string(),
  z.object({
    $type: z.string(),
    $value: z.string(),
  }),
);
export type AzdoProperties = z.infer<typeof AzdoPropertiesSchema>;

export const AzdoPullRequestCommentSchema = z.object({
  id: z.number().optional(),
  parentCommentId: z.number().optional(),
  content: z.string(),
  commentType: AzdoCommentTypeSchema,
  publishedDate: z.string().optional(),
  author: AzdoIdentityRefSchema,
});
export type AzdoPullRequestComment = z.infer<typeof AzdoPullRequestCommentSchema>;
export const AzdoPullRequestCommentThreadSchema = z.object({
  id: z.number(),
  comments: AzdoPullRequestCommentSchema.array(),
  status: AzdoCommentThreadStatusSchema,
});
export type AzdoPullRequestCommentThread = z.infer<typeof AzdoPullRequestCommentThreadSchema>;

export const AzdoSubscriptionSchema = z.object({
  id: z.string(),
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

export type AzdoPrExtractedWithProperties = {
  pullRequestId: number;
  properties?: { name: string; value: string }[];
};

export type AzdoFileChange = {
  changeType: AzdoVersionControlChangeType;
  path: string;
  content?: string;
  encoding?: 'utf-8' | 'base64';
};
