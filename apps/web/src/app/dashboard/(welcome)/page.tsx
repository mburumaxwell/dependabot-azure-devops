import type { Metadata } from 'next';
import { headers as requestHeaders } from 'next/headers';
import { auth } from '@/lib/auth';
import { NoOrganizationsView, SelectOrganizationView } from './page.client';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Welcome to Paklo',
  openGraph: { url: `/dashboard` },
};

export default async function DashboardHomePage() {
  const headers = await requestHeaders();
  const organizations = await auth.api.listOrganizations({ headers });

  return (
    <div className='flex items-center justify-center h-full p-6'>
      {organizations.length === 0 ? <NoOrganizationsView /> : <SelectOrganizationView organizations={organizations} />}
    </div>
  );
}
