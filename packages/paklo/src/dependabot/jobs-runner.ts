import { type SecretMasker } from './api-client';
import { type DependabotConfig } from './config';
import { type DependabotExperiments } from './job';
import { makeRandomJobToken } from './job-builder';
import { type LocalDependabotServerOptions } from './server';

export type RunJobsResult = { id: number; success: boolean; message?: string; affectedPrs: number[] }[];

export type LocalJobsRunnerOptions = Pick<LocalDependabotServerOptions, 'debug' | 'dryRun'> & {
  jobTokenOverride?: string;
  credentialsTokenOverride?: string;
  secretMasker: SecretMasker;

  config: DependabotConfig;
  targetUpdateIds?: number[];
  outDir: string;
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
      jobToken: jobTokenOverride ?? makeRandomJobToken(),
      credentialsToken: credentialsTokenOverride ?? makeRandomJobToken(),
    };
  }

  public run(): Promise<RunJobsResult> {
    return Promise.resolve([{ id: -1, success: false, affectedPrs: [] }]);
  }
}
