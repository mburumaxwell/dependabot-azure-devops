import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { loggedIn } from './actions';
import { LoginForm } from './login-form';

export const metadata: Metadata = {
  title: 'Usage Statistics',
  description: 'View usage statistics',
  openGraph: { url: `/admin/usage` },
};

export default async function UsagePage() {
  const isLoggedIn = await loggedIn();
  if (isLoggedIn) {
    redirect('/admin/usage/view');
  }

  return (
    <main className='flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950'>
      <LoginForm />
    </main>
  );
}
