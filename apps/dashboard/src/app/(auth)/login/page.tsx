import { config } from '@/site-config';
import { LoginForm } from './form';

export default function LoginPage() {
  return <LoginForm config={config} />;
}
