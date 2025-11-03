import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { InviteAcceptView } from './page.client';

export const metadata: Metadata = {
  title: 'Accept Invitation',
  description: 'Join your organization and start managing projects',
  openGraph: { url: `/invite/accept` },
};

export default async function OrgInviteAcceptPage(props: PageProps<'/invite/accept'>) {
  const { id } = await props.searchParams;
  const invitationId = Array.isArray(id) ? id[0] : id;
  if (!invitationId) {
    notFound();
  }

  return <InviteAcceptView invitationId={invitationId} />;
}
