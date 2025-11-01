'use server';

import {
  ANONYMOUS_USER_ID,
  type AzureDevOpsOrganizationUrl,
  AzureDevOpsWebApiClient,
  extractOrganizationUrl,
} from '@paklo/core/azure';
import type { OrganizationType } from '@/lib/organization-types';
import { prisma } from '@/lib/prisma';

export async function validateOrganizationCredentials({
  type,
  url: inputUrl,
  token,
  organizationId,
}: {
  type: OrganizationType;
  url: string;
  token: string;
  /**
   * Optional organization ID to exclude from uniqueness check
   */
  organizationId?: string;
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
  const client = new AzureDevOpsWebApiClient(url, token);
  try {
    userId = await client.getUserId();

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

  // TODO: check for other permissions here so that we ensure it will keep working

  // ensure there is no other organization with the same URL
  const existingOrg = await prisma.organization.findFirst({
    where: {
      type,
      url: inputUrl,
      // exclude current organization from uniqueness check
      NOT: organizationId ? { id: organizationId } : undefined,
    },
  });
  if (existingOrg) {
    return {
      valid: false,
      message: 'An organization with the provided URL already exists',
    };
  }

  return { valid: true };
}
