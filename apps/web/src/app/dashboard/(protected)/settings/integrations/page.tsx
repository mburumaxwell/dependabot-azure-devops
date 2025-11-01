import type { Metadata } from 'next';
import { headers as requestHeaders } from 'next/headers';
import { auth } from '@/lib/auth';
import { GitHubSection, PrimaryIntegrationSection } from './page.client';

export const metadata: Metadata = {
  title: 'Integrations',
  description: 'Manage your organization integrations',
  openGraph: { url: `/dashboard/settings/integrations` },
};

export default async function IntegrationsPage() {
  const headers = await requestHeaders();
  const organization = await auth.api.getFullOrganization({ headers });

  return (
    <div className='p-6 w-full max-w-5xl mx-auto space-y-6'>
      <div>
        <h1 className='text-3xl font-semibold mb-2'>Integrations</h1>
        <p className='text-muted-foreground'>Manage your organization's integrations and access tokens</p>
      </div>

      {organization && (
        <>
          <PrimaryIntegrationSection organization={organization} />
          <GitHubSection organizationId={organization.id} />
        </>
      )}
    </div>
  );
}
