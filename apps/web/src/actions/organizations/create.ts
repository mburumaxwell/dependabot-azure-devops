'use server';

import { generateKey } from '@paklo/core/keygen';
import { headers as requestHeaders } from 'next/headers';
import { auth, type Organization } from '@/lib/auth';
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
      // token,
      region,

      // change current active organization to the new one
      keepCurrentActiveOrganization: false,
    },
  });

  if (!organization) {
    return { error: { message: 'Failed to create organization' } };
  }

  // generate webhook token - using base64url for better security and URL safety
  const webhooksToken = generateKey({ length: 32, encoding: 'base64url' });

  // create organization credential
  await prisma.organizationCredential.create({
    data: { id: organization.id, token, webhooksToken },
  });
  return { data: organization };
}
