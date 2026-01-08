'use server';

import { extractOrganizationUrl } from '@paklo/core/azure';
import { Keygen } from '@paklo/core/keygen';
import { headers as requestHeaders } from 'next/headers';
import { auth, type Organization } from '@/lib/auth';
import type { OrganizationType } from '@/lib/enums';
import { prisma } from '@/lib/prisma';
import type { RegionCode } from '@/lib/regions';

export type OrganizationCreateOptions = {
  name: string;
  slug: string;
  type: OrganizationType;
  url: string;
  token: string;
  region: RegionCode;
};

export async function createOrganizationWithCredential(
  options: OrganizationCreateOptions,
): Promise<{ data: Organization; error?: undefined } | { data?: undefined; error: { message: string } }> {
  const { name, slug, type, url, token, region } = options;
  const headers = await requestHeaders();
  const organization = await auth.api.createOrganization({
    headers,
    body: {
      name,
      slug,
      type,
      url,
      region,
      ...getProviderStuff(options),
    },
  });

  if (!organization) {
    return { error: { message: 'Failed to create organization' } };
  }

  // generate webhook token
  const webhooksToken = Keygen.generate({ length: 32, encoding: 'base62' });

  // create organization credential
  await prisma.organizationCredential.create({
    data: { id: organization.id, token, webhooksToken },
  });

  return { data: organization };
}

type GetProviderStuffResult = Pick<Organization, 'providerHostname' | 'providerApiEndpoint'>;
function getProviderStuff({ type, url: organisationUrl }: OrganizationCreateOptions): GetProviderStuffResult {
  let hostname: string;
  let apiEndpoint: string;

  switch (type) {
    case 'azure': {
      const url = extractOrganizationUrl({ organisationUrl });
      hostname = url.hostname;
      apiEndpoint = url['api-endpoint'];
      break;
    }
    default:
      throw new Error(`Unsupported organization type: ${type}`);
  }

  return { providerHostname: hostname, providerApiEndpoint: apiEndpoint };
}
