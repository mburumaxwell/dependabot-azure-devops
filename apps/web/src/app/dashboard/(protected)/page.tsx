import type { Metadata } from 'next';
import { headers as requestHeaders } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

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

  // TODO: implement this page
  return (
    <div className='flex flex-1 flex-col gap-4 p-4'>
      <div className='grid auto-rows-min gap-4 md:grid-cols-3'>
        <div className='bg-muted/50 aspect-video rounded-xl' />
        <div className='bg-muted/50 aspect-video rounded-xl' />
        <div className='bg-muted/50 aspect-video rounded-xl' />
      </div>
      <div className='bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min' />
    </div>
  );
}
