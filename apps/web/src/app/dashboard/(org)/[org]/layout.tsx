import { headers as requestHeaders } from 'next/headers';
import { forbidden } from 'next/navigation';
import { AppLayout } from '@/components/app-layout';
import { auth, isPakloAdmin } from '@/lib/auth';

export { dashboardMetadata as metadata } from '@/lib/metadata';

export default async function Layout({ children, params }: LayoutProps<'/dashboard/[org]'>) {
  const { org: organizationSlug } = await params;
  const headers = await requestHeaders();
  const session = (await auth.api.getSession({ headers }))!;
  const organizations = (await auth.api.listOrganizations({ headers })).map((org) => ({
    id: org.id,
    name: org.name,
    slug: org.slug,
    type: org.type,
    logo: org.logo,
    active: org.slug === organizationSlug,
  }));
  const pakloAdmin = isPakloAdmin(session);
  // ensure user has access to the organization in the url
  if (!organizations.find((org) => org.active)) return forbidden();

  return (
    <AppLayout session={session} organizations={organizations} pakloAdmin={pakloAdmin}>
      {children}
    </AppLayout>
  );
}
