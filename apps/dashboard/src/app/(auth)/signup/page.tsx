import { config } from '@/site-config';
import { SignupForm } from './form';

export default function SignupPage() {
  return (
    <div className='bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10'>
      <div className='w-full max-w-sm'>
        <SignupForm config={config} />
      </div>
    </div>
  );
}
