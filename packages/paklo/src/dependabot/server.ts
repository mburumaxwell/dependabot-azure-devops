import { createAdaptorServer } from '@hono/node-server';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { type AddressInfo } from 'node:net';
import { z, type ZodType } from 'zod/v4';

import { type GitAuthor } from './author';
import { type DependabotUpdate } from './config';
import { logger } from './logger';
import { type DependabotInput, type DependabotOperationType } from './scenario';
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

export const DependabotRequestSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('create_pull_request'), data: DependabotCreatePullRequestSchema }),
  z.object({ type: z.literal('update_pull_request'), data: DependabotUpdatePullRequestSchema }),
  z.object({ type: z.literal('close_pull_request'), data: DependabotClosePullRequestSchema }),
  z.object({
    type: z.literal('record_update_job_error'),
    data: DependabotRecordUpdateJobErrorSchema,
  }),
  z.object({
    type: z.literal('record_update_job_unknown_error'),
    data: DependabotRecordUpdateJobUnknownErrorSchema,
  }),
  z.object({ type: z.literal('mark_as_processed'), data: DependabotMarkAsProcessedSchema }),
  z.object({
    type: z.literal('update_dependency_list'),
    data: DependabotUpdateDependencyListSchema,
  }),
  z.object({
    type: z.literal('record_ecosystem_versions'),
    data: DependabotRecordEcosystemVersionsSchema,
  }),
  z.object({
    type: z.literal('record_ecosystem_meta'),
    data: DependabotRecordEcosystemMetaSchema.array(),
  }),
  z.object({ type: z.literal('increment_metric'), data: DependabotIncrementMetricSchema }),
  z.object({ type: z.literal('record_metrics'), data: DependabotMetricSchema.array() }),
]);
export type DependabotRequest = z.infer<typeof DependabotRequestSchema>;

/**
 * Function type for authenticating requests.
 * @param id - The ID of the dependabot job.
 * @param value - The authentication value (e.g., API key).
 * @returns A promise that resolves to a boolean indicating whether the authentication was successful.
 */
type AuthenticatorFunc = (id: number, value: string) => Promise<boolean>;

/**
 * Handler function for processing dependabot requests.
 * @param id - The ID of the dependabot job.
 * @param request - The dependabot request to handle.
 * @returns A promise that resolves to the result of handling the request.
 */
type HandlerFunc = (id: number, request: DependabotRequest) => Promise<DependabotRequestHandleResult>;

export type CreateApiServerAppOptions = {
  /**
   * Base path for the endpoints.
   * @default `/api/update_jobs`
   */
  basePath?: string;

  /** Handle function for authenticating requests */
  authenticator?: AuthenticatorFunc;

  /** Handler function for processing the operations */
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
export function createApiServerApp({ basePath = `/api/update_jobs`, authenticator, handle }: CreateApiServerAppOptions): Hono {
  // Setup app with base path and middleware
  const app = new Hono().basePath(basePath);

  // Handle endpoints:
  // - POST request to /create_pull_request
  // - POST request to /update_pull_request
  // - POST request to /close_pull_request
  // - POST request to /record_update_job_error
  // - POST request to /record_update_job_unknown_error
  // - PATCH request to /mark_as_processed
  // - POST request to /update_dependency_list
  // - POST request to /record_ecosystem_versions
  // - POST request to /record_ecosystem_meta
  // - POST request to /increment_metric

  function operation<T extends ZodType>(type: DependabotOperationType, schema: T, method?: string) {
    app.on(
      method || 'post',
      `/:id/${type}`,
      zValidator('param', z.object({ id: z.coerce.number() })),
      async (context, next) => {
        if (authenticator) {
          const { id } = context.req.valid('param');
          const value = context.req.header('Authorization');
          if (!value) return context.body(null, 401);
          const valid = await authenticator(id, value);
          if (!valid) return context.body(null, 403);
        }
        await next();
      },
      zValidator('json', z.object({ data: schema })),
      async (context) => {
        const { id } = context.req.valid('param');
        const { data } = context.req.valid('json') as { data: z.infer<typeof schema> };
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        const success = await handle(id, { type, data: data as any });
        return context.body(null, success ? 200 : 400);
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

  return app;
}

export type LocalDependabotServerOptions = Omit<CreateApiServerAppOptions, 'handle'> & {
  author: GitAuthor;
  debug: boolean;
  dryRun: boolean;
};
export type DependabotRequestHandleResult = {
  success: boolean;
  pr?: number;
};

export abstract class LocalDependabotServer {
  private readonly hostname = 'localhost';
  private readonly server: ReturnType<typeof createAdaptorServer>;
  private readonly jobs = new Map<number, DependabotInput & { update: DependabotUpdate; token: string }>();

  protected readonly createdPullRequestIds: number[] = [];
  protected readonly author: LocalDependabotServerOptions['author'];
  protected readonly debug: LocalDependabotServerOptions['debug'];
  protected readonly dryRun: LocalDependabotServerOptions['dryRun'];

  constructor(options: LocalDependabotServerOptions) {
    const app = createApiServerApp({
      ...options,
      authenticator: this.authenticate.bind(this),
      handle: this.handle.bind(this),
    });
    this.server = createAdaptorServer(app);

    this.author = options.author;
    this.debug = options.debug;
    this.dryRun = options.dryRun;
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

  /**
   * Adds a dependabot job.
   * @param value - The dependabot job to add.
   */
  addJob(value: DependabotInput & { update: DependabotUpdate; token: string }) {
    this.jobs.set(value.job.id!, value);
  }

  /**
   * Gets a dependabot job by ID.
   * @param id - The ID of the dependabot job to get.
   * @returns The dependabot job, or undefined if not found.
   */
  getJob(id: number) {
    return this.jobs.get(id);
  }

  protected async authenticate(id: number, value: string) {
    const job = this.jobs.get(id);
    if (!job) {
      logger.debug(`Authentication failed: job ${id} not found`);
      return false;
    }
    if (job.token !== value) {
      logger.debug(`Authentication failed: invalid token for job ${id}`);
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
  protected abstract handle(id: number, request: DependabotRequest): Promise<DependabotRequestHandleResult>;
}
