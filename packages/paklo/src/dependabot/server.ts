import type { AddressInfo } from 'node:net';
import { createAdaptorServer } from '@hono/node-server';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { type ZodType, z } from 'zod/v4';

import type { GitAuthor } from './author';
import type { DependabotUpdate } from './config';
import type { DependabotCredential, DependabotJobConfig } from './job';
import { logger } from './logger';
import {
  DependabotClosePullRequestSchema,
  DependabotCreatePullRequestSchema,
  DependabotIncrementMetricSchema,
  DependabotMarkAsProcessedSchema,
  DependabotMetricSchema,
  DependabotRecordEcosystemMetaSchema,
  DependabotRecordEcosystemVersionsSchema,
  DependabotRecordUpdateJobErrorSchema,
  DependabotRecordUpdateJobUnknownErrorSchema,
  DependabotUpdateDependencyListSchema,
  DependabotUpdatePullRequestSchema,
} from './update';

export const DependabotRequestTypeSchema = z.enum([
  'create_pull_request',
  'update_pull_request',
  'close_pull_request',
  'record_update_job_error',
  'record_update_job_unknown_error',
  'mark_as_processed',
  'update_dependency_list',
  'record_ecosystem_versions',
  'record_ecosystem_meta',
  'increment_metric',
  'record_metrics',
]);
export type DependabotRequestType = z.infer<typeof DependabotRequestTypeSchema>;

export const DependabotRequestSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('create_pull_request'), data: DependabotCreatePullRequestSchema }),
  z.object({ type: z.literal('update_pull_request'), data: DependabotUpdatePullRequestSchema }),
  z.object({ type: z.literal('close_pull_request'), data: DependabotClosePullRequestSchema }),
  z.object({ type: z.literal('record_update_job_error'), data: DependabotRecordUpdateJobErrorSchema }),
  z.object({ type: z.literal('record_update_job_unknown_error'), data: DependabotRecordUpdateJobUnknownErrorSchema }),
  z.object({ type: z.literal('mark_as_processed'), data: DependabotMarkAsProcessedSchema }),
  z.object({ type: z.literal('update_dependency_list'), data: DependabotUpdateDependencyListSchema }),
  z.object({ type: z.literal('record_ecosystem_versions'), data: DependabotRecordEcosystemVersionsSchema }),
  z.object({ type: z.literal('record_ecosystem_meta'), data: DependabotRecordEcosystemMetaSchema.array() }),
  z.object({ type: z.literal('increment_metric'), data: DependabotIncrementMetricSchema }),
  z.object({ type: z.literal('record_metrics'), data: DependabotMetricSchema.array() }),
]);
export type DependabotRequest = z.infer<typeof DependabotRequestSchema>;

export type DependabotTokenType = 'job' | 'credentials';

/**
 * Function type for authenticating requests.
 * @param type - The type of authentication ('job' or 'credentials').
 * @param id - The ID of the dependabot job.
 * @param value - The authentication value (e.g., API key).
 * @returns A promise that resolves to a boolean indicating whether the authentication was successful.
 */
type AuthenticatorFunc = (type: DependabotTokenType, id: number, value: string) => Promise<boolean>;

/**
 * Handler function for processing dependabot requests.
 * @param id - The ID of the dependabot job.
 * @param request - The dependabot request to handle.
 * @returns A promise that resolves to the result of handling the request.
 */
type HandlerFunc = (id: number, request: DependabotRequest) => Promise<boolean>;

export type CreateApiServerAppOptions = {
  /**
   * Base path for the endpoints.
   * @default `/api/update_jobs`
   */
  basePath?: string;

  /** Handler function for authenticating requests. */
  authenticate: AuthenticatorFunc;

  /** Function for getting a dependabot job by ID. */
  getJob: (id: number) => Promise<DependabotJobConfig | undefined>;

  /** Function for getting dependabot credentials by job ID. */
  getCredentials: (id: number) => Promise<DependabotCredential[] | undefined>;

  /** Handler function for processing the operations. */
  handle: HandlerFunc;
};

/**
 * Creates an API server application for handling dependabot update jobs.
 * The endpoints in the server application have paths in the format: `/api/update_jobs/:id/{operation}`,
 * where `:id` is the job ID and `{operation}` is one of the defined operations e.g. `create_pull_request`.
 *
 * You should set the job endpoint URL in the job container to
 * `http://<host>:<port>/api/update_jobs/:id` where `<host>` and `<port>` are the host and port
 *
 * These endpoints are protected using the provided API key.
 * @param params - The parameters for creating the API server application.
 * @returns The created API server application.
 */
export function createApiServerApp({
  basePath = `/api/update_jobs`,
  authenticate,
  getJob,
  getCredentials,
  handle,
}: CreateApiServerAppOptions): Hono {
  // Setup app with base path and middleware
  const app = new Hono().basePath(basePath);

  // Handle endpoints:
  // - POST  request to /create_pull_request
  // - POST  request to /update_pull_request
  // - POST  request to /close_pull_request
  // - POST  request to /record_update_job_error
  // - POST  request to /record_update_job_unknown_error
  // - PATCH request to /mark_as_processed
  // - POST  request to /update_dependency_list
  // - POST  request to /record_ecosystem_versions
  // - POST  request to /record_ecosystem_meta
  // - POST  request to /increment_metric

  function operation<T extends ZodType>(type: DependabotRequestType, schema: T, method?: string) {
    app.on(
      method || 'post',
      `/:id/${type}`,
      zValidator('param', z.object({ id: z.coerce.number() })),
      async (context, next) => {
        /**
         * Do not authenticate in scenarios where the server is not using HTTPS because the
         * dependabot proxy will not send the job token over HTTP, yet trying to get HTTPS to work
         * with localhost (self-signed certs) against docker (host.docker.internal) is complicated.
         */
        const url = new URL(context.req.url);
        const isHTTPS = url.protocol === 'https:';
        if (isHTTPS) {
          const { id } = context.req.valid('param');
          const value = context.req.header('Authorization');
          if (!value) return context.body(null, 401);
          const valid = await authenticate('job', id, value);
          if (!valid) return context.body(null, 403);
        } else {
          logger.trace(`Skipping authentication because it is not secure ${context.req.url}`);
        }
        await next();
      },
      zValidator('json', z.object({ data: schema })),
      async (context) => {
        const { id } = context.req.valid('param');
        const { data } = context.req.valid('json') as { data: z.infer<typeof schema> };
        // biome-ignore lint/suspicious/noExplicitAny: generic
        const success: boolean = await handle(id, { type, data: data as any });
        return context.body(null, success ? 204 : 400);
      },
    );
  }

  operation('create_pull_request', DependabotCreatePullRequestSchema);
  operation('update_pull_request', DependabotUpdatePullRequestSchema);
  operation('close_pull_request', DependabotClosePullRequestSchema);
  operation('record_update_job_error', DependabotRecordUpdateJobErrorSchema);
  operation('record_update_job_unknown_error', DependabotRecordUpdateJobUnknownErrorSchema);
  operation('mark_as_processed', DependabotMarkAsProcessedSchema, 'patch');
  operation('update_dependency_list', DependabotUpdateDependencyListSchema);
  operation('record_ecosystem_versions', DependabotRecordEcosystemVersionsSchema);
  operation('record_ecosystem_meta', DependabotRecordEcosystemMetaSchema.array());
  operation('increment_metric', DependabotIncrementMetricSchema);
  operation('record_metrics', DependabotMetricSchema.array());

  // Handle endpoints:
  // - GET request to /details
  // - GET request to /credentials
  app.get(
    '/:id/details',
    zValidator('param', z.object({ id: z.coerce.number() })),
    async (context, next) => {
      const { id } = context.req.valid('param');
      const value = context.req.header('Authorization');
      if (!value) return context.body(null, 401);
      const valid = await authenticate('job', id, value);
      if (!valid) return context.body(null, 403);
      await next();
    },
    async (context) => {
      const { id } = context.req.valid('param');
      const job = await getJob(id);
      if (!job) return context.body(null, 204);
      return context.json(job);
    },
  );
  app.get(
    '/:id/credentials',
    zValidator('param', z.object({ id: z.coerce.number() })),
    async (context, next) => {
      const { id } = context.req.valid('param');
      const value = context.req.header('Authorization');
      if (!value) return context.body(null, 401);
      const valid = await authenticate('credentials', id, value);
      if (!valid) return context.body(null, 403);
      await next();
    },
    async (context) => {
      const { id } = context.req.valid('param');
      const credentials = await getCredentials(id);
      if (!credentials) return context.body(null, 204);
      return context.json(credentials);
    },
  );

  return app;
}

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

  start(port: number) {
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
