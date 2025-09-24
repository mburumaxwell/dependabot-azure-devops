// Code below is borrowed and adapted from dependabot-action

export class JobParameters {
  constructor(
    readonly jobId: number,
    readonly jobToken: string,
    readonly credentialsToken: string,
    readonly dependabotApiUrl: string,
    readonly dependabotApiDockerUrl: string,
    readonly updaterImage: string,
  ) {}
}

export function getJobParameters(input: {
  jobId?: string | number;
  jobToken?: string;
  credentialsToken?: string;
  dependabotApiUrl?: string;
  dependabotApiDockerUrl?: string;
  updaterImage?: string;
}): JobParameters | null {
  return new JobParameters(
    parseInt(input.jobId as string, 10),
    input.jobToken as string,
    input.credentialsToken as string,
    input.dependabotApiUrl as string,
    input.dependabotApiDockerUrl as string,
    input.updaterImage as string,
  );
}
