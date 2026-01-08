'use server';

import { ANONYMOUS_USER_ID, type AzureDevOpsOrganizationUrl, extractOrganizationUrl } from '@paklo/core/azure';
import { createGitHubClient } from '@paklo/core/github';
import { RequestError } from 'octokit';
import { deleteKeyVaultSecret, getKeyVaultSecret, setKeyVaultSecret } from '@/lib/azure';
import type { OrganizationType } from '@/lib/enums';
import { type Organization, prisma } from '@/lib/prisma';
import type { RegionCode } from '@/lib/regions';
import { createAzdoClient } from './client';

export async function validateOrganizationCredentials({
  type,
  url: inputUrl,
  token,
  id,
}: {
  type: OrganizationType;
  url: string;
  token: string;
  /** Optional organization ID to exclude from uniqueness check */
  id?: string;
}): Promise<{ valid: boolean; message?: string }> {
  // ensure the URL can be parsed
  let url: AzureDevOpsOrganizationUrl;
  try {
    url = extractOrganizationUrl({ organizationUrl: inputUrl });
  } catch (_error) {
    return {
      valid: false,
      message: 'Invalid URL format',
    };
  }

  // ensure the token is valid and is not anonymous
  let userId: string;
  const client = await createAzdoClient({ url, token });
  try {
    userId = (await client.connection.get()).authenticatedUser.id;

    if (!userId || userId === ANONYMOUS_USER_ID) {
      return {
        valid: false,
        message: 'Invalid credentials provided',
      };
    }
  } catch (_error) {
    return {
      valid: false,
      message: 'Failed to connect to Azure DevOps with provided credentials. Please check your URL.',
    };
  }

  // TODO: check for all needed permissions here so that we ensure it will keep working

  // ensure there is no other organization with the same URL
  const existing = await prisma.organization.findFirst({
    where: {
      type,
      url: inputUrl,
      // exclude current organization from uniqueness check
      NOT: id ? { id } : undefined,
    },
  });
  if (existing) {
    return {
      valid: false,
      message: 'An organization with the provided URL already exists',
    };
  }

  return { valid: true };
}

export async function validateGitHubToken({ token }: { token: string }): Promise<{ valid: boolean; message?: string }> {
  if (!token || token.trim().length === 0) {
    return { valid: false, message: 'Token is required' };
  }

  try {
    const octokit = createGitHubClient({ token });

    // Ensure the token works by fetching the authenticated user's information
    await octokit.rest.users.getAuthenticated();

    // Check if the token has the required 'repo' scope
    try {
      await octokit.rest.repos.listForAuthenticatedUser({
        per_page: 1,
        type: 'all',
      });
    } catch (error) {
      // If we can get user info but not repos, the token might not have repo scope
      if (error instanceof Error && error.message.includes('403')) {
        return {
          valid: false,
          message:
            'Token is valid but missing required "repo" scope. Please ensure your token has repository access permissions.',
        };
      }
      throw error;
    }
  } catch (error) {
    if (error instanceof RequestError) {
      if (error.status === 401) {
        return { valid: false, message: 'Invalid token. Please check your GitHub personal access token.' };
      }
      if (error.status === 403) {
        return {
          valid: false,
          message: 'Token has insufficient permissions. Please ensure it has the required scopes.',
        };
      }
      if (error.status === 429) {
        return { valid: false, message: 'Rate limit exceeded. Please try again later.' };
      }

      return { valid: false, message: `GitHub API error: ${error.message} (status: ${error.status})` };
    }

    return { valid: false, message: `Token validation failed: ${(error as Error).message}` };
  }

  return { valid: true };
}

export async function updateOrganizationToken({
  id,
  token,
}: {
  /** The ID of the organization, whose token to update */
  id: string;
  token: string;
}): Promise<{ success: boolean; error?: { message: string } }> {
  try {
    await prisma.organizationCredential.update({
      where: { id },
      data: { token },
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: { message: (error as Error).message } };
  }
}

export async function updateGithubToken({
  id,
  token,
}: {
  /** The ID of the organization, whose token to update */
  id: string;
  token: string;
}): Promise<{ success: boolean; error?: { message: string } }> {
  try {
    // fetch organization
    const organization = await prisma.organization.findUniqueOrThrow({ where: { id } });

    // fetch credential
    const credential = await prisma.organizationCredential.findUniqueOrThrow({
      where: { id },
    });

    // update the token in Azure Key Vault
    const { region } = organization;
    let { githubTokenSecretUrl: url } = credential;
    if (url) {
      await setKeyVaultSecret({ region, url, value: token });
    } else {
      // create a new secret in Azure Key Vault
      url = await setKeyVaultSecret({ region, name: `github-${credential.id}`, value: token });

      // update the credential with the URL
      await prisma.organizationCredential.update({
        where: { id },
        data: { githubTokenSecretUrl: url },
      });
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: { message: (error as Error).message } };
  }
}

type GetGithubTokenOptions =
  | {
      /** The ID of the organization for which to get the token */
      id: string;
    }
  | {
      /** The organization for which to get the token */
      organization: Pick<Organization, 'id' | 'region'>;
    };
export async function getGithubToken(options: GetGithubTokenOptions): Promise<string | undefined> {
  const { id, region } = await getOrganizationIdAndRegion(options);

  // fetch credential
  const credential = await prisma.organizationCredential.findUnique({
    where: { id },
  });
  if (!credential || !credential.githubTokenSecretUrl) return undefined;

  // fetch the secret from Azure Key Vault
  return await getKeyVaultSecret({ region, url: credential.githubTokenSecretUrl });
}

export async function deleteGithubToken(options: GetGithubTokenOptions): Promise<void> {
  const { id, region } = await getOrganizationIdAndRegion(options);

  // fetch credential
  const credential = await prisma.organizationCredential.findUnique({
    where: { id },
  });
  if (!credential) return;

  // if there is a secret URL, delete the secret from Azure Key Vault
  if (credential.githubTokenSecretUrl) {
    await deleteKeyVaultSecret({ region, url: credential.githubTokenSecretUrl });
  }

  // update the credential to remove the secret URL
  await prisma.organizationCredential.update({
    where: { id },
    data: { githubTokenSecretUrl: null },
  });
}

async function getOrganizationIdAndRegion(options: GetGithubTokenOptions): Promise<{ id: string; region: RegionCode }> {
  const id = 'id' in options ? options.id : options.organization.id;
  let region: RegionCode | undefined;
  if ('organization' in options) {
    region = options.organization.region;
  } else {
    const organization = await prisma.organization.findUniqueOrThrow({ where: { id } });
    region = organization.region;
  }
  return { id, region };
}
