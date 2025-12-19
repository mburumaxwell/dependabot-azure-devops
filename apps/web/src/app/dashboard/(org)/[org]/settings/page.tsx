import { redirect } from 'next/navigation';

export default async function SettingsPage(props: PageProps<'/dashboard/[org]/settings'>) {
  const { org: organizationSlug } = await props.params;
  // may add a view later but for now it is just a redirect
  redirect(`/dashboard/${organizationSlug}/settings/team`);
}
