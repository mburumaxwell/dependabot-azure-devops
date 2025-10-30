import type { Metadata } from 'next';
import { LoginForm } from './form';

export const metadata: Metadata = {
  title: 'Login',
  description: 'Log in to your paklo account',
  openGraph: { url: `/login` },
};

export default function LoginPage() {
  return <LoginForm />;
}
