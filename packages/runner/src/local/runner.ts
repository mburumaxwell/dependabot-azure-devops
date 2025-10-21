import {
  type DependabotConfig,
  type DependabotExperiments,
  type DependabotJobConfig,
  makeRandomJobToken,
} from '@paklo/core/dependabot';
import type { SecretMasker } from '@paklo/runner';

export type RunJobsResult = { id: number; success: boolean; message?: string; affectedPrs: number[] }[];

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
      jobToken: jobTokenOverride ?? makeRandomJobToken(),
      credentialsToken: credentialsTokenOverride ?? makeRandomJobToken(),
    };
  }

  public run(): Promise<RunJobsResult> {
    return Promise.resolve([{ id: -1, success: false, affectedPrs: [] }]);
  }
}
