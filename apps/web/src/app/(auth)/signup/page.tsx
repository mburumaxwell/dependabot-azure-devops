import type { Metadata } from 'next';
import { SignupForm } from './form';

export const metadata: Metadata = {
  title: 'Sign Up',
  description: 'Create a new Paklo account',
  openGraph: { url: `/signup` },
};

export default function SignupPage() {
  return <SignupForm />;
}
