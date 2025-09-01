import type Docker from 'dockerode';
import { type Container } from 'dockerode';

import { ContainerService } from './container-service';
import { type FileFetcherInput, type FileUpdaterInput } from './job';
import { logger } from './logger';
import { type JobParameters } from './params';
import { type Proxy } from './proxy';

const JOB_OUTPUT_FILENAME = 'output.json';
const JOB_OUTPUT_PATH = '/home/dependabot/dependabot-updater/output';
const JOB_INPUT_FILENAME = 'job.json';
const JOB_INPUT_PATH = `/home/dependabot/dependabot-updater`;
const REPO_CONTENTS_PATH = '/home/dependabot/dependabot-updater/repo';
const CA_CERT_INPUT_PATH = '/usr/local/share/ca-certificates';
const CA_CERT_FILENAME = 'dbot-ca.crt';
const UPDATER_MAX_MEMORY = 8 * 1024 * 1024 * 1024; // 8GB in bytes

export class UpdaterBuilder {
  constructor(
    private readonly docker: Docker,
    private readonly jobParams: JobParameters,
    private readonly input: FileFetcherInput | FileUpdaterInput,
    private readonly outputHostPath: string,
    private readonly proxy: Proxy,

    private readonly updaterImage: string,
  ) {}

  async run(containerName: string): Promise<Container> {
    const proxyUrl = await this.proxy.url();
    const container = await this.docker.createContainer({
      Image: this.updaterImage,
      name: containerName,
      AttachStdout: true,
      AttachStderr: true,
      User: 'dependabot',
      Env: [
        `GITHUB_ACTIONS=${process.env.GITHUB_ACTIONS}`,
        `DEPENDABOT_JOB_ID=${this.jobParams.jobId}`,
        `DEPENDABOT_JOB_TOKEN=`,
        `DEPENDABOT_JOB_PATH=${JOB_INPUT_PATH}/${JOB_INPUT_FILENAME}`,
        `DEPENDABOT_OPEN_TIMEOUT_IN_SECONDS=15`,
        `DEPENDABOT_OUTPUT_PATH=${JOB_OUTPUT_PATH}/${JOB_OUTPUT_FILENAME}`,
        `DEPENDABOT_REPO_CONTENTS_PATH=${REPO_CONTENTS_PATH}`,
        `DEPENDABOT_API_URL=${this.jobParams.dependabotApiDockerUrl}`,
        `SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt`,
        `http_proxy=${proxyUrl}`,
        `HTTP_PROXY=${proxyUrl}`,
        `https_proxy=${proxyUrl}`,
        `HTTPS_PROXY=${proxyUrl}`,
        `UPDATER_ONE_CONTAINER=1`,
        `ENABLE_CONNECTIVITY_CHECK=${process.env.DEPENDABOT_ENABLE_CONNECTIVITY_CHECK || '1'}`,
      ],
      Cmd: ['/bin/sh'],
      Tty: true,
      HostConfig: {
        Memory: UPDATER_MAX_MEMORY,
        NetworkMode: this.proxy.networkName,
      },
    });

    await ContainerService.storeCert(CA_CERT_FILENAME, CA_CERT_INPUT_PATH, container, this.proxy.cert);

    await ContainerService.storeInput(JOB_INPUT_FILENAME, JOB_INPUT_PATH, container, this.input);

    logger.info(`Created container: ${container.id}`);
    return container;
  }
}
