import { type Job as ContainerAppJob, ContainerAppsAPIClient, type ContainerResources } from '@azure/arm-appcontainers';
import { ComputeManagementClient } from '@azure/arm-compute';
import { RestError } from '@azure/core-rest-pipeline';
import { ClientAssertionCredential, DefaultAzureCredential, type TokenCredential } from '@azure/identity';
import { parseKeyVaultSecretIdentifier, SecretClient } from '@azure/keyvault-secrets';
import { BlobServiceClient } from '@azure/storage-blob';
import { getVercelOidcToken } from '@vercel/oidc';
import { environment } from '@/lib/environment';

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

export const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID!;

export const secretClient = new SecretClient(process.env.AZURE_KEY_VAULT_URL!, credential);
export const blobServiceClient = new BlobServiceClient(process.env.AZURE_BLOB_STORAGE_URL!, credential);
export const consoleLogsContainer = blobServiceClient.getContainerClient('insights-logs-containerappconsolelogs');
export const logsContainer = blobServiceClient.getContainerClient('dependabot-job-logs');

export const computeClient = new ComputeManagementClient(credential, subscriptionId);
export const containerAppsClient = new ContainerAppsAPIClient(credential, subscriptionId);

export const resourceGroupName = process.env.AZURE_RESOURCE_GROUP!;
export const resourceGroupNameJobs = process.env.AZURE_RESOURCE_GROUP_JOBS!;
export const managedAppEnvironmentId = process.env.AZURE_MANAGED_ENVIRONMENT_ID!;

export { RestError as AzureRestError };
export type { ContainerAppJob, ContainerResources };

/**
 * Get a secret from Azure Key Vault
 * @returns The value of the secret or undefined if not found
 */
export async function getKeyVaultSecret({ url }: { url: string }): Promise<string | undefined> {
  if (!url) return undefined;

  // parse the URL
  let name: string;
  try {
    name = parseKeyVaultSecretIdentifier(url).name;
  } catch {
    return undefined;
  }

  // fetch the secret
  try {
    const secret = await secretClient.getSecret(name);
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
  value,
  ...options
}: ({ name: string } | { url: string }) & { value: string }): Promise<string> {
  let name: string;
  if ('name' in options) name = options.name;
  else {
    // parse the URL
    try {
      name = parseKeyVaultSecretIdentifier(options.url).name;
    } catch {
      throw new Error('Invalid secret URL');
    }
  }

  // set the secret
  const secret = await secretClient.setSecret(name, value, {
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
export async function deleteKeyVaultSecret({ url }: { url: string }) {
  if (!url) return;

  // parse the URL
  let name: string;
  try {
    name = parseKeyVaultSecretIdentifier(url).name;
  } catch {
    return;
  }

  // delete and purge the secret
  try {
    await secretClient.beginDeleteSecret(name);
    await secretClient.purgeDeletedSecret(name);
  } catch (error) {
    if (error instanceof RestError && error.statusCode === 404) {
      return;
    }
    throw error;
  }
}
