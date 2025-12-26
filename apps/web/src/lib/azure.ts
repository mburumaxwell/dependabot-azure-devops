import { type Job as ContainerAppJob, ContainerAppsAPIClient, type ContainerResources } from '@azure/arm-appcontainers';
import { RestError } from '@azure/core-rest-pipeline';
import { ClientAssertionCredential, DefaultAzureCredential, type TokenCredential } from '@azure/identity';
import { parseKeyVaultSecretIdentifier, SecretClient } from '@azure/keyvault-secrets';
import { BlobServiceClient } from '@azure/storage-blob';
import { getVercelOidcToken } from '@vercel/oidc';
import { environment } from '@/lib/environment';
import { isRegionAvailable, type RegionCode } from '@/lib/regions';

/**
 * There are only 3 possible places we run the application:
 * 1. Locally, during development
 * 2. In Vercel, during preview or production deployments
 * 3. In Azure, e.g. Azure Functions or other services
 *
 * The authentication method to access Azure resources differs based on the environment.
 * Options 1 and 3 both use a chain from DefaultAzureCredential.
 * When running in Vercel (Option 2), we use client assertion with the Vercel OIDC token helper.
 */
export const credential: TokenCredential =
  environment.platform === 'vercel'
    ? new ClientAssertionCredential(
        // https://vercel.com/docs/oidc/azure
        process.env.AZURE_TENANT_ID!,
        process.env.AZURE_CLIENT_ID!,
        getVercelOidcToken,
      )
    : new DefaultAzureCredential({
        // this helps when I have many tenants in my dev environment
        tenantId: process.env.AZURE_TENANT_ID,
      });

export const BLOB_CONTAINER_NAME_LOGS = 'dependabot-job-logs';
export const BLOB_CONTAINER_NAME_CONSOLE_LOGS = 'insights-logs-containerappconsolelogs';

export const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID!;
export const resourceGroupNameJobs = process.env.AZURE_RESOURCE_GROUP_JOBS!;

export { RestError as AzureRestError };
export type { ContainerAppJob, ContainerResources };

type Clients = {
  /** Azure Key Vault client for secrets */
  secrets: SecretClient;
  /** Azure Blob Storage client */
  blobs: BlobServiceClient;
  /** Azure Container Apps client */
  containerApps: ContainerAppsAPIClient;
  /** Managed Environment ID for Azure Container Apps */
  environmentId: string;
};
// list of clients per region
const clientsMap: Partial<Record<RegionCode, Clients>> = {};

/**
 * Get clients for a specific region.
 * @param region The region code
 * @returns The clients for the region
 * @throws If the region is not available/provisioned
 */
export function getClients(region: RegionCode): Clients {
  if (!isRegionAvailable(region)) {
    throw new Error(`Region ${region} is not yet available/provisioned`);
  }

  let clients = clientsMap[region];
  if (!clients) {
    const resourceName = `paklo${region}`;
    // for now, we use the same client (only one region at the moment)
    clients = {
      secrets: new SecretClient(`https://${resourceName}.vault.azure.net`, credential),
      blobs: new BlobServiceClient(`https://${resourceName}.blob.core.windows.net`, credential),
      containerApps: new ContainerAppsAPIClient(credential, subscriptionId),
      // format: /subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.App/managedEnvironments/{environmentName}
      environmentId: [
        `/subscriptions/${subscriptionId}`,
        `resourceGroups/${resourceGroupNameJobs}`,
        `providers`,
        `Microsoft.App/managedEnvironments`,
        resourceName,
      ].join('/'),
    };
    clientsMap[region] = clients;
  }
  return clients;
}

/**
 * Get a secret from Azure Key Vault
 * @returns The value of the secret or undefined if not found
 */
export async function getKeyVaultSecret({
  region,
  url,
}: {
  region: RegionCode;
  url: string;
}): Promise<string | undefined> {
  if (!url) return undefined;

  // parse the URL
  let name: string;
  try {
    name = parseKeyVaultSecretIdentifier(url).name;
  } catch {
    return undefined;
  }

  const { secrets: client } = getClients(region);

  // fetch the secret
  try {
    const secret = await client.getSecret(name);
    return secret.value;
  } catch (error) {
    if (error instanceof RestError && error.statusCode === 404) {
      return undefined;
    }
    throw error;
  }
}

/**
 * Create or update a secret in the vault
 * @returns The URL of the stored secret
 */
export async function setKeyVaultSecret({
  region,
  value,
  ...options
}: ({ name: string } | { url: string }) & { region: RegionCode; value: string }): Promise<string> {
  let name: string;
  if ('name' in options) {
    name = options.name;
    // remove any invalid characters from the name
    name = name.replace(/[^0-9a-zA-Z-]/g, '-');
  } else {
    // parse the URL
    try {
      name = parseKeyVaultSecretIdentifier(options.url).name;
    } catch {
      throw new Error('Invalid secret URL');
    }
  }

  const { secrets: client } = getClients(region);

  // set the secret
  const secret = await client.setSecret(name, value, {
    contentType: 'text/plain',
    enabled: true,
    tags: { managedBy: 'paklo-web' },
  });
  // the id is usually the URL of the secret, e.g. https://{vault-name}.vault.azure.net/secrets/{secret-name}
  return secret.properties.id!;
}

/**
 * Delete a secret from the vault
 */
export async function deleteKeyVaultSecret({ region, url }: { region: RegionCode; url: string }) {
  if (!url) return;

  // parse the URL
  let name: string;
  try {
    name = parseKeyVaultSecretIdentifier(url).name;
  } catch {
    return;
  }

  const { secrets: client } = getClients(region);

  // delete and purge the secret
  try {
    await client.beginDeleteSecret(name);
    await client.purgeDeletedSecret(name);
  } catch (error) {
    if (error instanceof RestError && error.statusCode === 404) {
      return;
    }
    throw error;
  }
}
