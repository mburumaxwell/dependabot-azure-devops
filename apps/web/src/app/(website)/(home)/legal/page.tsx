import { redirect } from 'next/navigation';

export default async function LegalPage() {
  // may add a view later but for now it is just a redirect
  redirect('/legal/terms');
}
