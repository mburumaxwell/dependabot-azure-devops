'use client';

import { Loader2, Mail } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { PakloLogo } from '@/components/logos';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSeparator } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { magicLinkLogin } from '@/lib/auth-client';
import { cn } from '@/lib/utils';
import type { SiteConfig } from '@/site-config';

interface SignupFormProps extends React.ComponentProps<'div'> {
  // config is passed here to bridge server and client components
  config: SiteConfig;
}

export function SignupForm({ className, config, ...props }: SignupFormProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      await magicLinkLogin({ config, email });
      setMagicLinkSent(true);
    } catch (error) {
      console.error('Signup error:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <FieldGroup>
        <div className='flex flex-col items-center gap-2 text-center'>
          <a href={config.websiteUrl} className='flex flex-col items-center gap-2 font-medium'>
            <div className='flex size-8 items-center justify-center rounded-md'>
              <PakloLogo className='size-6' />
            </div>
            <span className='sr-only'>Paklo</span>
          </a>
          <h1 className='text-xl font-bold'>Welcome to Paklo Dashboard</h1>
          <FieldDescription>
            Already have an account? <Link href='/login'>Login</Link>
          </FieldDescription>
        </div>
      </FieldGroup>
      {magicLinkSent ? (
        <div className='text-center space-y-4'>
          <div className='space-y-4 text-center'>
            <div className='flex justify-center'>
              <div className='rounded-full bg-primary/10 p-3'>
                <Mail className='h-6 w-6 text-primary' />
              </div>
            </div>
          </div>
          <FieldGroup>
            <FieldDescription className='font-semibold text-lg'>Check your email</FieldDescription>
            <FieldDescription>
              We sent a magic link to <span className='font-medium'>{email}</span>. Click the link to complete your
              signup and login.
            </FieldDescription>
            <Field>
              <Button variant='ghost' onClick={() => setMagicLinkSent(false)}>
                Use a different email
              </Button>
            </Field>
          </FieldGroup>
        </div>
      ) : (
        <form className='space-y-4' onSubmit={handleSignup}>
          <Field>
            <FieldLabel htmlFor='email'>Email</FieldLabel>
            <Input
              id='email'
              type='email'
              placeholder='chris@contoso.com'
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </Field>
          <Field>
            <Button type='submit' disabled={isLoading || !email} size='lg'>
              {isLoading ? (
                <Loader2 className='size-5 animate-spin' />
              ) : (
                <>
                  <Mail className='size-5' />
                  Continue with email
                </>
              )}
            </Button>
          </Field>
        </form>
      )}
      <FieldSeparator />
      <FieldDescription className='text-center text-xs'>
        By continuing, you agree to our{' '}
        <a href={config.legal.terms} target='_blank'>
          Terms of Service
        </a>{' '}
        and{' '}
        <a href={config.legal.privacy} target='_blank'>
          Privacy Policy
        </a>
        .
      </FieldDescription>
    </div>
  );
}
