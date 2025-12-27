import type { Metadata } from 'next';
import { WorkInProgressPage } from '@/components/work-in-progress-page';

export async function generateMetadata(props: PageProps<'/dashboard/[org]/advisories'>): Promise<Metadata> {
  const { org } = await props.params;
  return {
    title: 'Advisories',
    description: 'View your advisories',
    openGraph: { url: `/dashboard/${org}/advisories` },
  };
}

// TODO: implement this page
export default async function AdvisoriesPage(props: PageProps<'/dashboard/[org]/advisories'>) {
  return <WorkInProgressPage />;
}
