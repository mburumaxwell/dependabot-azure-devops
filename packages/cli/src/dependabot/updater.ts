// biome-ignore-all lint/suspicious/noShadowRestrictedNames: Proxy is okay

import Docker, { type Container } from 'dockerode';

import { ContainerService } from './container-service';
import type { DependabotCredential, DependabotJobConfig, FileFetcherInput, FileUpdaterInput } from './job';
import type { JobParameters } from './params';
import { type Proxy, ProxyBuilder } from './proxy';
import { UpdaterBuilder } from './updater-builder';

// Code below is borrowed and adapted from dependabot-action

export class Updater {
  docker: Docker;

  constructor(
    private readonly updaterImage: string,
    private readonly proxyImage: string,
    private readonly params: JobParameters,
    private readonly job: DependabotJobConfig,
    private readonly credentials: DependabotCredential[],
  ) {
    this.docker = new Docker();
    this.job['credentials-metadata'] = this.generateCredentialsMetadata();
  }

  /**
   * Execute an update job and report the result to Dependabot API.
   */
  async runUpdater(): Promise<boolean> {
    const cachedMode = Object.hasOwn(this.job.experiments, 'proxy-cached') === true;

    const proxyBuilder = new ProxyBuilder(this.docker, this.proxyImage, cachedMode);

    const proxy = await proxyBuilder.run(
      this.params.jobId,
      this.params.jobToken,
      this.params.dependabotApiUrl,
      this.credentials,
    );
    await proxy.container.start();

    try {
      await this.runUpdate(proxy);
      return true;
    } finally {
      await this.cleanup(proxy);
    }
  }

  private generateCredentialsMetadata(): DependabotCredential[] {
    const unique: Set<string> = new Set();
    const result: DependabotCredential[] = [];
    for (const credential of this.credentials) {
      if (credential.type === 'jit_access') {
        continue;
      }

      // biome-ignore lint/suspicious/noExplicitAny: necessary
      const obj: any = { type: credential.type };
      if (credential.host !== undefined) {
        obj.host = credential.host;
      }
      if (credential.registry !== undefined) {
        obj.registry = credential.registry;
      }
      if (credential.url !== undefined) {
        obj.url = credential.url;
      }
      this.setRegistryFromUrl(obj, credential);
      if (credential['index-url'] !== undefined) {
        obj['index-url'] = credential['index-url'];
      }
      this.setIndexUrlFromUrl(obj, credential);
      if (credential['env-key'] !== undefined) {
        obj['env-key'] = credential['env-key'];
      }
      if (credential.organization !== undefined) {
        obj.organization = credential.organization;
      }
      if (credential['replaces-base'] !== undefined) {
        obj['replaces-base'] = credential['replaces-base'];
      }
      if (credential['public-key-fingerprint'] !== undefined) {
        obj['public-key-fingerprint'] = credential['public-key-fingerprint'];
      }
      if (credential.repo !== undefined) {
        obj.repo = credential.repo;
      }
      const key = JSON.stringify(obj);
      if (!unique.has(key)) {
        unique.add(key);
        result.push(obj as DependabotCredential);
      }
    }
    return result;
  }

  private setRegistryFromUrl(obj: DependabotCredential, credential: DependabotCredential): void {
    const typesThatUseRegistryAsHost = ['npm_registry', 'composer_repository', 'docker_registry'];

    if (!typesThatUseRegistryAsHost.includes(credential.type)) {
      return;
    }

    if (!credential.registry && credential.url) {
      try {
        const parsedURL = new URL(credential.url);
        obj.registry = parsedURL.hostname;
        if (credential.type === 'npm_registry') {
          obj.registry += parsedURL.pathname;
        }
      } catch {
        // If the URL is invalid, we skip setting the registry
        // as it will fall back to the default registry for the given type (e.g., npm, Docker, or Composer).
      }
    }
  }

  private setIndexUrlFromUrl(obj: DependabotCredential, credential: DependabotCredential): void {
    if (credential.type !== 'python_index') {
      return;
    }
    if (credential['index-url']) {
      return;
    }
    if (credential.url) {
      try {
        obj['index-url'] = credential.url;
      } catch {
        // If the URL is invalid, we skip setting the index-url
        // as it will fall back to the default index URL for pip.
      }
    }
  }

  private async runUpdate(proxy: Proxy): Promise<void> {
    const name = `dependabot-job-${this.params.jobId}`;
    const container = await this.createContainer(proxy, name, {
      job: this.job,
    });

    await ContainerService.run(container, this.job.command);
  }

  private async createContainer(
    proxy: Proxy,
    containerName: string,
    input: FileFetcherInput | FileUpdaterInput,
  ): Promise<Container> {
    const builder = new UpdaterBuilder(this.docker, this.params, input, proxy, this.updaterImage);
    return builder.run(containerName);
  }

  private async cleanup(proxy: Proxy): Promise<void> {
    await proxy.shutdown();
  }
}
