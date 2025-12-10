import { redirect } from 'next/navigation';

export default async function SettingsPage() {
  // may add a view later but for now it is just a redirect
  redirect('/dashboard/settings/team');
}
