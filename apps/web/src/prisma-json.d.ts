// This file must be a module, so we include an empty export.
// biome-ignore lint/complexity/noUselessEmptyExport: as above
export {};

import type {
  DependabotPackageManager as ImportedDependabotPackageManager,
  PackageEcosystem as ImportedPackageEcosystem,
  DependabotPersistedPr as ImportedDependabotPersistedPr,
  DependabotConfig as ImportedDependabotConfig,
  DependabotJobConfig as ImportedDependabotJobConfig,
  DependabotCredential as ImportedDependabotCredential,
  DependabotJobError as ImportedDependabotJobError,
  DependabotRecordUpdateJobWarning as ImportedDependabotRecordUpdateJobWarning,
} from '@paklo/core/dependabot';
import type { RegionCode as ImportedRegionCode } from '@/lib/regions';
import type { Period as ImportedPeriod } from '@/lib/period';
import type { FeedbackType as ImportedFeedbackType, FeedbackOpinion as ImportedFeedbackOpinion } from '@/lib/feedback';
import type {
  UpdateJobStatus as ImportedUpdateJobStatus,
  UpdateJobTrigger as ImportedUpdateJobTrigger,
  RepositoryPullRequestStatus as ImportedRepositoryPullRequestStatus,
  SynchronizationStatus as ImportedSynchronizationStatus,
  SubscriptionStatus as ImportedSubscriptionStatus,
} from '@/lib/enums';

declare global {
  namespace PrismaJson {
    type DependabotPackageManager = ImportedDependabotPackageManager;
    type PackageEcosystem = ImportedPackageEcosystem;
    type DependabotPersistedPr = ImportedDependabotPersistedPr;
    type DependabotConfig = ImportedDependabotConfig;
    type DependabotJobConfig = ImportedDependabotJobConfig;
    type DependabotCredential = ImportedDependabotCredential;
    type DependabotJobError = ImportedDependabotJobError;
    type DependabotRecordUpdateJobWarning = ImportedDependabotRecordUpdateJobWarning;
    type RegionCode = ImportedRegionCode;
    type Period = ImportedPeriod;
    type FeedbackType = ImportedFeedbackType;
    type FeedbackOpinion = ImportedFeedbackOpinion;
    type UpdateJobStatus = ImportedUpdateJobStatus;
    type UpdateJobTrigger = ImportedUpdateJobTrigger;
    type RepositoryPullRequestStatus = ImportedRepositoryPullRequestStatus;
    type SynchronizationStatus = ImportedSynchronizationStatus;
    type SubscriptionStatus = ImportedSubscriptionStatus;
  }
}
