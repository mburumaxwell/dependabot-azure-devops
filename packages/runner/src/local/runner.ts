import type { DependabotCommand, DependabotConfig, DependabotExperiments } from '@paklo/core/dependabot';
import { Keygen } from '@paklo/core/keygen';
import type { SecretMasker } from '../api-client';

export type RunJobsResult = { id: string; success: boolean; message?: string; affectedPrs: number[] }[];

export type LocalJobsRunnerOptions = {
  jobTokenOverride?: string;
  credentialsTokenOverride?: string;
  secretMasker: SecretMasker;

  config: DependabotConfig;
  targetUpdateIds?: number[];
  command: DependabotCommand;
  experiments: DependabotExperiments;
  updaterImage?: string;
};

export abstract class LocalJobsRunner {
  private readonly opt: LocalJobsRunnerOptions;

  constructor(options: LocalJobsRunnerOptions) {
    this.opt = options;
  }

  protected makeTokens() {
    const { jobTokenOverride, credentialsTokenOverride } = this.opt;
    return {
      jobToken: jobTokenOverride ?? Keygen.generate(),
      credentialsToken: credentialsTokenOverride ?? Keygen.generate(),
    };
  }

  public run(): Promise<RunJobsResult> {
    return Promise.resolve([{ id: '-1', success: false, affectedPrs: [] }]);
  }
}
