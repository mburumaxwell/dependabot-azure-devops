import { type DependabotConfig } from './config';
import { makeRandomJobToken } from './job-builder';
import { type RunJobResult } from './job-runner';
import { type LocalDependabotServerOptions } from './server';

export type LocalJobsRunnerOptions = Pick<LocalDependabotServerOptions, 'debug' | 'dryRun'> & {
  jobTokenOverride?: string;
  credentialsTokenOverride?: string;

  config: DependabotConfig;
  targetUpdateIds?: number[];
  outDir: string;
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

  public run(): Promise<RunJobResult> {
    return Promise.resolve({ success: true });
  }
}
