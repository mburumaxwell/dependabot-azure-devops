import type { Metadata } from 'next';
import { headers as requestHeaders } from 'next/headers';
import type { OrganizationSecretSafe } from '@/actions/organizations';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SecretsView } from './page.client';

export const metadata: Metadata = {
  title: 'Secrets',
  description: 'Manage organization secrets',
  openGraph: { url: `/dashboard/secrets` },
};

export default async function SecretsPage() {
  const headers = await requestHeaders();
  const session = (await auth.api.getSession({ headers }))!;

  const organizationId = session.session.activeOrganizationId;
  if (!organizationId) return null;

  const secrets: OrganizationSecretSafe[] = !organizationId
    ? []
    : await prisma.organizationSecret.findMany({
        where: { organizationId },
        select: {
          id: true,
          name: true,
          createdAt: true,
          updatedAt: true,
          secretUrl: false, // Do not select the url for listing
        },
        orderBy: { name: 'asc' },
      });

  return <SecretsView organizationId={organizationId} secrets={secrets} />;
}
