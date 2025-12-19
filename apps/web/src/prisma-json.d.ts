// This file must be a module, so we include an empty export.
// biome-ignore lint/complexity/noUselessEmptyExport: as above
export {};

import type {
  DependabotPersistedPr as ImportedDependabotPersistedPr,
  DependabotConfig as ImportedDependabotConfig,
  DependabotJobConfig as ImportedDependabotJobConfig,
  DependabotCredential as ImportedDependabotCredential,
  DependabotJobError as ImportedDependabotJobError,
  DependabotRecordUpdateJobWarning as ImportedDependabotRecordUpdateJobWarning,
} from '@paklo/core/dependabot';

declare global {
  namespace PrismaJson {
    type DependabotPersistedDep = {
      name: string;
      version?: string;
    };
    type DependabotPersistedPr = ImportedDependabotPersistedPr;
    type DependabotConfig = ImportedDependabotConfig;
    type DependabotJobConfig = ImportedDependabotJobConfig;
    type DependabotCredential = ImportedDependabotCredential;
    type DependabotJobError = ImportedDependabotJobError;
    type DependabotRecordUpdateJobWarning = ImportedDependabotRecordUpdateJobWarning;
  }
}
