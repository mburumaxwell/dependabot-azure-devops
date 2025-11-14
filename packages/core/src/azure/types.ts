export enum VersionControlChangeType {
  None = 0,
  Add = 1,
  Edit = 2,
  Encoding = 4,
  Rename = 8,
  Delete = 16,
  Undelete = 32,
  Branch = 64,
  Merge = 128,
  Lock = 256,
  Rollback = 512,
  SourceRename = 1024,
  TargetRename = 2048,
  Property = 4096,
  All = 8191,
}

export enum GitPullRequestMergeStrategy {
  NoFastForward = 1,
  Squash = 2,
  Rebase = 3,
  RebaseMerge = 4,
}

export enum CommentThreadStatus {
  Unknown = 0,
  Active = 1,
  Fixed = 2,
  WontFix = 3,
  Closed = 4,
  ByDesign = 5,
  Pending = 6,
}
export enum CommentType {
  Unknown = 0,
  Text = 1,
  CodeChange = 2,
  System = 3,
}
export enum ItemContentType {
  RawText = 0,
  Base64Encoded = 1,
}
export enum PullRequestAsyncStatus {
  NotSet = 0,
  Queued = 1,
  Conflicts = 2,
  Succeeded = 3,
  RejectedByPolicy = 4,
  Failure = 5,
}
export enum PullRequestStatus {
  NotSet = 0,
  Active = 1,
  Abandoned = 2,
  Completed = 3,
  All = 4,
}

export type IdentityRefWithVote = {
  id?: string;
  displayName?: string;
  uniqueName?: string;
  url?: string;
  imageUrl?: string;
  vote?: number;
  hasDeclined?: boolean;
  isFlagged?: boolean;
  isRequired?: boolean;
};

export type AzdoProject = {
  id: string;
  name: string;
  description?: string;
  url: string;
  state: 'deleting' | 'new' | 'wellFormed' | 'createPending' | 'all' | 'unchanged' | 'deleted';
  _links?: {
    self: { href: string };
    collection: { href: string };
    web: { href: string };
  };
};

export type AzdoRepository = {
  id: string;
  name: string;
  defaultBranch?: string;
  project: AzdoProject;
  isDisabled?: boolean;
  isFork?: boolean;
  url: string;
  remoteUrl: string;
  webUrl: string;
};

export type AzdoListResponse<T> = {
  value: T[];
  count: number;
};

export type AzdoRepositoryItem = {
  latestProcessedChange?: {
    commitId?: string;
  };
  content?: string;
};
