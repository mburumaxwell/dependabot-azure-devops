// Code below is borrowed and adapted from dependabot-action

/*
 `jobId` is intentionally a string even though we copied from code that used number
 We generate the job identifiers using Snowflake which produces bigint
 and bigint cannot be serialized to JSON, so we use string everywhere instead.
 The hosted dependabot possible uses auto-incrementing numbers for jobIds in their database,
 but not all databases support this.
*/

export class JobParameters {
  constructor(
    readonly jobId: string,
    readonly jobToken: string,
    readonly credentialsToken: string,
    readonly dependabotApiUrl: string,
    readonly dependabotApiDockerUrl: string,
    readonly updaterImage: string,
  ) {}
}

export function getJobParameters(input: {
  jobId?: string;
  jobToken?: string;
  credentialsToken?: string;
  dependabotApiUrl?: string;
  dependabotApiDockerUrl?: string;
  updaterImage?: string;
}): JobParameters | null {
  return new JobParameters(
    input.jobId as string,
    input.jobToken as string,
    input.credentialsToken as string,
    input.dependabotApiUrl as string,
    input.dependabotApiDockerUrl as string,
    input.updaterImage as string,
  );
}
