import type { Metadata } from 'next';
import { headers as requestHeaders } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GitHubSection, PrimaryIntegrationSection, WebhooksSection } from './page.client';

export const metadata: Metadata = {
  title: 'Integrations',
  description: 'Manage your organization integrations',
  openGraph: { url: `/dashboard/settings/integrations` },
};

export default async function IntegrationsPage() {
  const headers = await requestHeaders();
  const organization = await auth.api.getFullOrganization({ headers });
  if (!organization) return null;

  // Get token status directly from database
  const credential = await prisma.organizationCredential.findUniqueOrThrow({
    where: { id: organization.id },
    select: {
      githubToken: true,
    },
  });

  const hasGithubToken = !!credential.githubToken;

  return (
    <div className='p-6 w-full max-w-5xl mx-auto space-y-6'>
      <div>
        <h1 className='text-3xl font-semibold mb-2'>Integrations</h1>
        <p className='text-muted-foreground'>Manage your organization's integrations and access tokens</p>
      </div>

      <PrimaryIntegrationSection organization={organization} />
      <GitHubSection organizationId={organization.id} hasToken={hasGithubToken} />
      <WebhooksSection organization={organization} />
    </div>
  );
}
