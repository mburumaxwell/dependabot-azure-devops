import type { Metadata } from 'next';
import { LoginForm } from './form';

export const metadata: Metadata = {
  title: 'Login',
  description: 'Log in to your paklo account',
  openGraph: { url: `/login` },
};

export default async function LoginPage(props: PageProps<'/login'>) {
  const { redirectTo: rawRedirectTo } = await props.searchParams;
  const redirectTo = Array.isArray(rawRedirectTo) ? rawRedirectTo[0] : rawRedirectTo;

  return <LoginForm redirectTo={redirectTo} />;
}
