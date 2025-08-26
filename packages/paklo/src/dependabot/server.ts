import { createAdaptorServer } from '@hono/node-server';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { bearerAuth } from 'hono/bearer-auth';
import { logger as loggerMiddleware } from 'hono/logger';
import { type AddressInfo } from 'node:net';
import { z, type ZodType } from 'zod/v4';

import { logger } from './logger';
import { type DependabotOperationType } from './scenario';
import {
  DependabotClosePullRequestSchema,
  DependabotCreatePullRequestSchema,
  DependabotIncrementMetricSchema,
  DependabotMarkAsProcessedSchema,
  DependabotRecordEcosystemMetaSchema,
  DependabotRecordEcosystemVersionsSchema,
  DependabotRecordUpdateJobErrorSchema,
  DependabotRecordUpdateJobUnknownErrorSchema,
  DependabotUpdateDependencyListSchema,
  DependabotUpdatePullRequestSchema,
} from './update';

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
type HandlerFunc = (type: DependabotOperationType, data: any) => Promise<boolean>;
export type LocalDependabotServerAppOptions = {
  /**
   * Base path for the endpoints.
   * @default `/api/update_jobs`
   */
  basePath?: string;

  /**
   * Optional API key for protecting the endpoints
   * Do not specify this if you are using the dependabot CLI as it does not support API keys.
   */
  apiKey?: string;

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
export function createApiServerApp({
  basePath = `/api/update_jobs`,
  apiKey,
  handle,
}: LocalDependabotServerAppOptions): Hono {
  // Setup app with base path and middleware
  const app = new Hono().basePath(basePath);
  app.use(loggerMiddleware((str) => logger.debug(str))); // logger must be earliest
  // TODO: apiKey should not be optional once we move away from dependabot CLI
  if (apiKey) app.use('/*', bearerAuth({ token: apiKey }));

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
    app.on(method || 'post', `/:id/${type}`, zValidator('json', z.object({ data: schema })), async (context) => {
      const id = context.req.param('id');
      const { data } = context.req.valid('json') as { data: z.infer<typeof schema> };
      const success = await handle(type, data);
      return context.body(null, success ? 200 : 400);
    });
  }

  operation('create_pull_request', DependabotCreatePullRequestSchema);
  operation('update_pull_request', DependabotUpdatePullRequestSchema);
  operation('close_pull_request', DependabotClosePullRequestSchema);
  operation('record_update_job_error', DependabotRecordUpdateJobErrorSchema);
  operation('record_update_job_unknown_error', DependabotRecordUpdateJobUnknownErrorSchema);
  operation('mark_as_processed', DependabotMarkAsProcessedSchema, 'patch');
  operation('update_dependency_list', DependabotUpdateDependencyListSchema);
  operation('record_ecosystem_versions', DependabotRecordEcosystemVersionsSchema);
  operation('record_ecosystem_meta', DependabotRecordEcosystemMetaSchema);
  operation('increment_metric', DependabotIncrementMetricSchema);

  return app;
}

export class LocalDependabotServer {
  private readonly hostname = 'localhost';
  private readonly server: ReturnType<typeof createAdaptorServer>;

  constructor(options: LocalDependabotServerAppOptions) {
    const app = createApiServerApp(options);
    this.server = createAdaptorServer(app);
  }

  start(port: number) {
    this.server.listen(port, this.hostname, () => {
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
}
