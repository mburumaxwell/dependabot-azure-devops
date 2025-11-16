'use server';

import { generateKey } from '@paklo/core/keygen';
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

export async function createOrganizationWithCredential({
  name,
  slug,
  type,
  url,
  token,
  region,
}: OrganizationCreateOptions): Promise<{ data?: Organization; error?: { message: string } }> {
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
  const webhooksToken = generateKey({ length: 32, encoding: 'base62' });

  // create organization credential
  await prisma.organizationCredential.create({
    data: { id: organization.id, token, webhooksToken },
  });

  // no billing to be created for free tier

  return { data: organization };
}
