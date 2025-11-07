import type { Metadata } from 'next';
import { headers as requestHeaders } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GitHubSection, PrimaryIntegrationSection } from './page.client';

export const metadata: Metadata = {
  title: 'Integrations',
  description: 'Manage your organization integrations',
  openGraph: { url: `/dashboard/settings/integrations` },
};

export default async function IntegrationsPage() {
  const headers = await requestHeaders();
  const organization = await auth.api.getFullOrganization({ headers });

  if (!organization) {
    return null;
  }

  // Get token status directly from database
  const credential = await prisma.organizationCredential.findUnique({
    where: { id: organization.id },
    select: {
      token: true,
      githubToken: true,
    },
  });

  const hasToken = credential ? !!credential.token : false;
  const hasGithubToken = credential ? !!credential.githubToken : false;

  return (
    <div className='p-6 w-full max-w-5xl mx-auto space-y-6'>
      <div>
        <h1 className='text-3xl font-semibold mb-2'>Integrations</h1>
        <p className='text-muted-foreground'>Manage your organization's integrations and access tokens</p>
      </div>

      <PrimaryIntegrationSection organization={organization} hasToken={hasToken} />
      <GitHubSection organizationId={organization.id} hasToken={hasGithubToken} />
    </div>
  );
}
