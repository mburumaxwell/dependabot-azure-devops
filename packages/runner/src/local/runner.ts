import type { DependabotConfig, DependabotExperiments, DependabotJobConfig } from '@paklo/core/dependabot';
import { generateKey } from '@paklo/core/keygen';
import type { SecretMasker } from '../api-client';

export type RunJobsResult = { id: string; success: boolean; message?: string; affectedPrs: number[] }[];

export type LocalJobsRunnerOptions = {
  jobTokenOverride?: string;
  credentialsTokenOverride?: string;
  secretMasker: SecretMasker;

  config: DependabotConfig;
  targetUpdateIds?: number[];
  experiments: DependabotExperiments;
  updaterImage?: string;
  command?: DependabotJobConfig['command'];
};

export abstract class LocalJobsRunner {
  private readonly opt: LocalJobsRunnerOptions;

  constructor(options: LocalJobsRunnerOptions) {
    this.opt = options;
  }

  protected makeTokens() {
    const { jobTokenOverride, credentialsTokenOverride } = this.opt;
    return {
      jobToken: jobTokenOverride ?? generateKey(),
      credentialsToken: credentialsTokenOverride ?? generateKey(),
    };
  }

  public run(): Promise<RunJobsResult> {
    return Promise.resolve([{ id: '-1', success: false, affectedPrs: [] }]);
  }
}
