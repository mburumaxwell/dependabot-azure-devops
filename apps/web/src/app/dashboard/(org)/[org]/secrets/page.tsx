import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { OrganizationSecretSafe } from '@/actions/organizations';
import { prisma } from '@/lib/prisma';
import { SecretsView } from './page.client';

export async function generateMetadata(props: PageProps<'/dashboard/[org]/secrets'>): Promise<Metadata> {
  const { org: organizationSlug } = await props.params;
  const organization = await getOrganization(organizationSlug);
  if (!organization) return notFound();

  return {
    title: 'Secrets',
    description: 'Manage organization secrets',
    openGraph: { url: `/dashboard/${organizationSlug}/secrets` },
  };
}

export default async function SecretsPage(props: PageProps<'/dashboard/[org]/secrets'>) {
  const { org: organizationSlug } = await props.params;
  const organization = await getOrganization(organizationSlug);
  if (!organization) return notFound();

  const secrets: OrganizationSecretSafe[] = await prisma.organizationSecret.findMany({
    where: { organizationId: organization.id },
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      description: true,
    },
    orderBy: { name: 'asc' },
  });

  return <SecretsView organization={organization} secrets={secrets} />;
}

function getOrganization(slug: string) {
  return prisma.organization.findUnique({
    where: { slug },
    select: { id: true, slug: true, region: true },
  });
}
