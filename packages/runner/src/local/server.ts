import type { AddressInfo } from 'node:net';
import { createAdaptorServer } from '@hono/node-server';
import {
  type CreateApiServerAppOptions,
  createApiServerApp,
  type DependabotCredential,
  type DependabotJobConfig,
  type DependabotRequest,
  type DependabotTokenType,
  type DependabotUpdate,
  type GitAuthor,
} from '@paklo/core/dependabot';
import { logger } from '@/logger';

export type LocalDependabotServerAddOptions = {
  /** The ID of the dependabot job. */
  id: number;
  /** The dependabot update associated with the job. */
  update: DependabotUpdate;
  /** The dependabot job configuration. */
  job: DependabotJobConfig;
  /** The authentication token for the job. */
  jobToken: string;
  /** The authentication token for the job. */
  credentialsToken: string;
  /** The credentials associated with the job. */
  credentials: DependabotCredential[];
};

export type AffectedPullRequestIds = {
  created: number[];
  updated: number[];
  closed: number[];
};

export type LocalDependabotServerOptions = Omit<
  CreateApiServerAppOptions,
  'authenticate' | 'getJob' | 'getCredentials' | 'handle'
> & {
  author: GitAuthor;
  debug: boolean;
  dryRun: boolean;
};
export abstract class LocalDependabotServer {
  private readonly hostname = 'localhost';
  private readonly server: ReturnType<typeof createAdaptorServer>;
  private readonly trackedJobs = new Map<number, DependabotJobConfig>();
  private readonly updates = new Map<number, DependabotUpdate>();
  private readonly jobTokens = new Map<number, string>();
  private readonly credentialTokens = new Map<number, string>();
  private readonly jobCredentials = new Map<number, DependabotCredential[]>();
  private readonly receivedRequests = new Map<number, DependabotRequest[]>();

  protected readonly affectedPullRequestIds = new Map<number, AffectedPullRequestIds>();

  constructor(options: LocalDependabotServerOptions) {
    const app = createApiServerApp({
      ...options,
      authenticate: this.authenticate.bind(this),
      getJob: this.job.bind(this),
      getCredentials: this.credentials.bind(this),
      handle: this.handle.bind(this),
    });
    this.server = createAdaptorServer({
      ...app,
      // Workaround for hono not respecting x-forwarded-proto header
      // https://github.com/honojs/node-server/issues/146#issuecomment-3153435672
      fetch: (req) => {
        const url = new URL(req.url);
        url.protocol = req.headers.get('x-forwarded-proto') ?? url.protocol;
        return app.fetch(new Request(url, req));
      },
    });
  }

  start(port?: number) {
    // listening to 'localhost' will result to IpV6 only but we need it to be all local
    // interfaces, otherwise containers cannot reach it using host.docker.internal
    this.server.listen(port, '0.0.0.0', () => {
      const info = this.server.address() as AddressInfo;
      logger.info(`API server listening on http://${this.hostname}:${info.port}`);
    });
  }

  stop() {
    this.server.close(() => logger.info('API server closed'));
  }

  get url() {
    const info = this.server.address() as AddressInfo;
    return `http://${this.hostname}:${info.port}`;
  }

  get port() {
    const info = this.server.address() as AddressInfo;
    return info.port;
  }

  get jobs() {
    return this.trackedJobs;
  }

  /**
   * Adds a dependabot job.
   * @param value - The dependabot job details.
   */
  add(value: LocalDependabotServerAddOptions) {
    const { id, update, job, jobToken, credentialsToken, credentials } = value;
    const {
      trackedJobs,
      updates,
      jobTokens,
      credentialTokens,
      jobCredentials,
      receivedRequests,
      affectedPullRequestIds,
    } = this;
    trackedJobs.set(id, job);
    updates.set(id, update);
    jobTokens.set(id, jobToken);
    credentialTokens.set(id, credentialsToken);
    jobCredentials.set(id, credentials);
    receivedRequests.set(id, []);
    affectedPullRequestIds.set(id, { created: [], updated: [], closed: [] });
  }

  /**
   * Gets a dependabot job by ID.
   * @param id - The ID of the dependabot job to get.
   * @returns The dependabot job, or undefined if not found.
   */
  job(id: number): Promise<DependabotJobConfig | undefined> {
    return Promise.resolve(this.trackedJobs.get(id));
  }

  /**
   * Gets a dependabot update by ID of the job.
   * @param id - The ID of the dependabot job to get.
   * @returns The dependabot update, or undefined if not found.
   */
  update(id: number): DependabotUpdate | undefined {
    return this.updates.get(id);
  }

  /**
   * Gets a token by ID of the job.
   * @param id - The ID of the dependabot job to get.
   * @returns The job token, or undefined if not found.
   */
  token(id: number, type: DependabotTokenType): string | undefined {
    return type === 'job' ? this.jobTokens.get(id) : this.credentialTokens.get(id);
  }

  /**
   * Gets the credentials for a dependabot job by ID.
   * @param id - The ID of the dependabot job to get credentials for.
   * @returns The credentials for the job, or undefined if not found.
   */
  credentials(id: number): Promise<DependabotCredential[] | undefined> {
    return Promise.resolve(this.jobCredentials.get(id));
  }

  /**
   * Gets the received requests for a dependabot job by ID.
   * @param id - The ID of the dependabot job to get requests for.
   * @returns The received requests for the job, or undefined if not found.
   */
  requests(id: number): DependabotRequest[] | undefined {
    return this.receivedRequests.get(id);
  }

  /**
   * Gets the IDs of pull requests affected by a dependabot job by ID.
   * @param id - The ID of the dependabot job to get affected pull request IDs for.
   * @returns The affected pull request IDs for the job, or undefined if not found.
   */
  affectedPrs(id: number): AffectedPullRequestIds | undefined {
    const { affectedPullRequestIds } = this;
    return affectedPullRequestIds.get(id);
  }

  /**
   * Gets all IDs of pull requests affected by a dependabot job by ID.
   * @param id - The ID of the dependabot job to get affected pull request IDs for.
   * @returns The affected pull request IDs for the job, or undefined if not found.
   */
  allAffectedPrs(id: number): number[] {
    const affected = this.affectedPrs(id);
    if (!affected) return [];
    return [...affected.created, ...affected.updated, ...affected.closed];
  }

  /**
   * Clears all data associated with a dependabot job by ID.
   * This should be called when the job is no longer needed.
   * @param id - The ID of the dependabot job to clear.
   */
  clear(id: number) {
    this.trackedJobs.delete(id);
    this.updates.delete(id);
    this.jobTokens.delete(id);
    this.credentialTokens.delete(id);
    this.jobCredentials.delete(id);
    this.receivedRequests.delete(id);
    this.affectedPullRequestIds.delete(id);
  }

  /**
   * Authenticates a dependabot job.
   * @param id - The ID of the dependabot job.
   * @param value - The authentication value (e.g., API key).
   * @returns A promise that resolves to a boolean indicating whether the authentication was successful.
   */
  protected async authenticate(type: DependabotTokenType, id: number, value: string): Promise<boolean> {
    const token = type === 'job' ? this.jobTokens.get(id) : this.credentialTokens.get(id);
    if (!token) {
      logger.debug(`Authentication failed: ${type} token ${id} not found`);
      return false;
    }
    if (token !== value) {
      logger.debug(`Authentication failed: invalid token for ${type} token ${id}`);
      return false;
    }
    return true;
  }

  /**
   * Handles a dependabot request.
   * @param id - The ID of the dependabot job.
   * @param request - The dependabot request to handle.
   * @returns A promise that resolves to the result of handling the request.
   */
  protected handle(id: number, request: DependabotRequest): Promise<boolean> {
    this.receivedRequests.get(id)!.push(request);
    return Promise.resolve(true);
  }
}
