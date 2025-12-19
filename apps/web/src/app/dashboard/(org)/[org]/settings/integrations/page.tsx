import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { GitHubSection, PrimaryIntegrationSection } from './page.client';

export async function generateMetadata(props: PageProps<'/dashboard/[org]/settings/integrations'>): Promise<Metadata> {
  const { org: organizationSlug } = await props.params;
  const organization = await getOrganization(organizationSlug);
  if (!organization) return notFound();

  return {
    title: 'Integrations',
    description: 'Manage your organization integrations',
    openGraph: { url: `/dashboard/${organizationSlug}/settings/integrations` },
  };
}

export default async function IntegrationsPage(props: PageProps<'/dashboard/[org]/settings/integrations'>) {
  const { org: organizationSlug } = await props.params;
  const organization = await getOrganization(organizationSlug);
  if (!organization) return notFound();

  // Get token status directly from database
  const credential = await prisma.organizationCredential.findUniqueOrThrow({
    where: { id: organization.id },
    select: {
      githubTokenSecretUrl: true,
    },
  });

  const hasGithubToken = !!credential.githubTokenSecretUrl;

  return (
    <div className='p-6 w-full max-w-5xl mx-auto space-y-6'>
      <div>
        <h1 className='text-3xl font-semibold mb-2'>Integrations</h1>
        <p className='text-muted-foreground'>Manage your organization's integrations and access tokens</p>
      </div>

      <PrimaryIntegrationSection organization={organization} />
      <GitHubSection organizationId={organization.id} hasToken={hasGithubToken} />
    </div>
  );
}

function getOrganization(slug: string) {
  return prisma.organization.findUnique({ where: { slug } });
}
