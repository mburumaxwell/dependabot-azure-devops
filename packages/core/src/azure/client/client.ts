import ky, { isHTTPError, type Options as KyOptions } from 'ky';
import { logger } from '@/logger';
import type { AzureDevOpsOrganizationUrl } from '../url-parts';
import { ConnectionClient } from './client-connection';
import { GitClient } from './client-git';
import { IdentityClient } from './client-identity';
import { ProjectsClient } from './client-projects';
import { PullRequestsClient } from './client-pull-requests';
import { RepositoriesClient } from './client-repositories';
import { HookSubscriptionsClient } from './client-subscriptions';

export class AzureDevOpsClient {
  public readonly connection: ConnectionClient;
  public readonly identity: IdentityClient;
  public readonly projects: ProjectsClient;
  public readonly repositories: RepositoriesClient;
  public readonly git: GitClient;
  public readonly pullRequests: PullRequestsClient;
  public readonly subscriptions: HookSubscriptionsClient;

  constructor(url: AzureDevOpsOrganizationUrl, accessToken: string, debug: boolean = false) {
    const organisationApiUrl = url.value.toString().replace(/\/$/, ''); // trim trailing slash
    const mainClientOptions = AzureDevOpsClient.createClientOptions(accessToken, debug, {
      prefixUrl: organisationApiUrl,
    });
    const mainClient = ky.create(mainClientOptions);
    this.connection = new ConnectionClient(mainClient);
    this.projects = new ProjectsClient(mainClient);
    this.repositories = new RepositoriesClient(mainClient);
    this.git = new GitClient(mainClient);
    this.pullRequests = new PullRequestsClient(mainClient);
    this.subscriptions = new HookSubscriptionsClient(mainClient);

    const identityApiUrl = url['identity-api-url'].toString().replace(/\/$/, ''); // trim trailing slash
    const identityClient = ky.create({ ...mainClientOptions, prefixUrl: identityApiUrl });
    this.identity = new IdentityClient(identityClient);
  }

  private static createClientOptions(accessToken: string, debug: boolean, options?: KyOptions): KyOptions {
    return {
      headers: {
        Authorization: `Basic ${Buffer.from(`:${accessToken}`).toString('base64')}`,
        Accept: 'application/json',
      },
      hooks: {
        beforeRequest: [
          async (request, options) => {
            if (debug) logger.debug(`🌎 🠊 [${request.method}] ${request.url}`);
          },
        ],
        afterResponse: [
          async (request, options, response) => {
            if (debug) {
              logger.debug(`🌎 🠈 [${response.status}] ${response.statusText}`);

              // log the request and response for debugging
              if (request.body) {
                logger.debug(`REQUEST: ${JSON.stringify(request.body)}`);
              }
              // const body = await response.text();
              // if (body) {
              //   logger.debug(`RESPONSE: ${body}`);
              // }
            }
          },
        ],
        beforeRetry: [
          async ({ request, options, error, retryCount }) => {
            if (debug && isHTTPError(error)) {
              logger.debug(`⏳ Retrying failed request with status code: ${error.response.status}`);
            }
          },
        ],
      },
      retry: {
        limit: 3,
        delay: (attempt) => 3000, // all attempts after 3 seconds
      },
      ...options,
    };
  }
}
