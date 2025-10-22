import { config } from '@/site-config';
import { SignupForm } from './form';

export default function SignupPage() {
  return <SignupForm config={config} />;
}
