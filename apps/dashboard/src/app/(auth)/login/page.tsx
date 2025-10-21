import { config } from '@/site-config';
import { LoginForm } from './form';

export default function LoginPage() {
  return (
    <div className='bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10'>
      <div className='w-full max-w-sm'>
        <LoginForm config={config} />
      </div>
    </div>
  );
}
