'use server';

import { ANONYMOUS_USER_ID, type AzureDevOpsOrganizationUrl, extractOrganizationUrl } from '@paklo/core/azure';
import { createGitHubClient } from '@paklo/core/github';
import { RequestError } from 'octokit';
import { getKeyVaultSecret, setKeyVaultSecret } from '@/lib/azure';
import { type OrganizationType, prisma } from '@/lib/prisma';
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
    url = extractOrganizationUrl({ organisationUrl: inputUrl });
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
    // fetch credential
    const credential = await prisma.organizationCredential.findUniqueOrThrow({
      where: { id },
    });

    // update the token in Azure Key Vault
    let { githubTokenSecretUrl: url } = credential;
    if (url) {
      await setKeyVaultSecret({ url, value: token });
    } else {
      // create a new secret in Azure Key Vault
      url = await setKeyVaultSecret({ name: `github-${credential.id}`, value: token });

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

export async function getGithubToken({
  id,
}: {
  /** The ID of the organization for which to get the token */
  id: string;
}): Promise<string | undefined> {
  // fetch credential
  const credential = await prisma.organizationCredential.findUnique({
    where: { id },
  });
  if (!credential || !credential.githubTokenSecretUrl) return undefined;

  // fetch the secret from Azure Key Vault
  return await getKeyVaultSecret({ url: credential.githubTokenSecretUrl });
}
