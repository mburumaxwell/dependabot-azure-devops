import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { InviteDeclineView } from './page.client';

export const metadata: Metadata = {
  title: 'Decline Invitation',
  description: 'Decline the invitation to join your organization',
  openGraph: { url: `/invite/decline` },
};

export default async function OrgInviteDeclinePage(props: PageProps<'/invite/decline'>) {
  const { id } = await props.searchParams;
  const invitationId = Array.isArray(id) ? id[0] : id;
  if (!invitationId) {
    notFound();
  }

  return <InviteDeclineView invitationId={invitationId} />;
}
