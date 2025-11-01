import type { Metadata } from 'next';
import { SignupForm } from './form';

export const metadata: Metadata = {
  title: 'Sign Up',
  description: 'Create a new Paklo account',
  openGraph: { url: `/signup` },
};

export default async function SignupPage(props: PageProps<'/signup'>) {
  const { redirectTo: rawRedirectTo } = await props.searchParams;
  const redirectTo = Array.isArray(rawRedirectTo) ? rawRedirectTo[0] : rawRedirectTo;

  return <SignupForm redirectTo={redirectTo} />;
}
