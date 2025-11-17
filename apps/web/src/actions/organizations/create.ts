'use server';

import { extractOrganizationUrl } from '@paklo/core/azure';
import { Keygen } from '@paklo/core/keygen';
import { headers as requestHeaders } from 'next/headers';
import { auth, type Organization } from '@/lib/auth';
import { getOrganizationTierInfo } from '@/lib/organizations';
import { type OrganizationType, prisma } from '@/lib/prisma';
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
): Promise<{ data?: Organization; error?: { message: string } }> {
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
      tier: 'free', // default to free tier
      billingInterval: 'monthly', // not supporting any other frequency yet
      ...getProviderStuff(options),

      // change current active organization to the new one
      keepCurrentActiveOrganization: false,
    },
  });

  if (!organization) {
    return { error: { message: 'Failed to create organization' } };
  }

  const tierInfo = getOrganizationTierInfo(organization.tier);
  await prisma.organization.update({
    where: { id: organization.id },
    data: { maxProjects: tierInfo.maxProjects },
  });

  // generate webhook token
  const webhooksToken = Keygen.generate({ length: 32, encoding: 'base62' });

  // create organization credential
  await prisma.organizationCredential.create({
    data: { id: organization.id, token, webhooksToken },
  });

  // no billing to be created for free tier

  return { data: organization };
}

type GetProviderStuffResult = Pick<Organization, 'providerHostname' | 'providerApiEndpoint'>;
function getProviderStuff({ type, url }: OrganizationCreateOptions): GetProviderStuffResult {
  let hostname: string;
  let apiEndpoint: string;

  switch (type) {
    case 'azure': {
      const extractedUrl = extractOrganizationUrl({ organisationUrl: url });
      hostname = extractedUrl.hostname;
      apiEndpoint = extractedUrl['api-endpoint'];
      break;
    }
    default:
      throw new Error(`Unsupported organization type: ${type}`);
  }

  return { providerHostname: hostname, providerApiEndpoint: apiEndpoint };
}
