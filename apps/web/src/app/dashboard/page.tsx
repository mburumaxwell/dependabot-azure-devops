import type { Metadata } from 'next';
import { headers as requestHeaders } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { NoOrganizationsView, SelectOrganizationView } from './page.client';

export const metadata: Metadata = {
  title: 'Home',
  description: 'Your Paklo dashboard overview',
  openGraph: { url: `/dashboard` },
};

export default async function DashboardHomePage() {
  const headers = await requestHeaders();
  const session = (await auth.api.getSession({ headers }))!;

  // if we have an active organization, redirect to its activity page
  if (session.session.activeOrganizationId) {
    redirect('/dashboard/activity');
  }

  // if we do not have an active organization, and the user has only one organization
  // set it as active and reload
  const organizations = await auth.api.listOrganizations({ headers });
  if (organizations.length === 1) {
    await auth.api.setActiveOrganization({
      headers,
      body: {
        organizationId: organizations[0]!.id,
      },
    });
    redirect('/dashboard/activity');
  }

  // at this point, the user does not have an active organization and
  // either has zero or multiple organizations, so we show a view to select organizations
  // or the view to guiding them to create a new organization.

  // Bare in mind that this page does not have the sidebar.
  if (organizations.length === 0) return <NoOrganizationsView />;
  return <SelectOrganizationView organizations={organizations} />;
}
