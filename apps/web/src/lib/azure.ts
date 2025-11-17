import { ContainerAppsAPIClient } from '@azure/arm-appcontainers';
import { ComputeManagementClient } from '@azure/arm-compute';
import { ClientAssertionCredential, DefaultAzureCredential, type TokenCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';
import { BlobServiceClient } from '@azure/storage-blob';
import { getVercelOidcToken } from '@vercel/oidc';

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
const credential: TokenCredential = process.env.VERCEL
  ? new ClientAssertionCredential(
      // https://vercel.com/docs/oidc/azure
      process.env.AZURE_TENANT_ID!,
      process.env.AZURE_CLIENT_ID!,
      getVercelOidcToken,
    )
  : new DefaultAzureCredential();

const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID!;

export const secretClient = new SecretClient(process.env.AZURE_KEY_VAULT_URL!, credential);
export const blobServiceClient = new BlobServiceClient(process.env.AZURE_BLOB_STORAGE_URL!, credential);
export const computeClient = new ComputeManagementClient(credential, subscriptionId);
export const containerAppsClient = new ContainerAppsAPIClient(credential, subscriptionId);
