'use client';

import { Fingerprint, Loader2, Mail } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { AppleLogo, GoogleLogo, PakloLogo } from '@/components/logos';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSeparator } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { authClient, magicLinkLogin } from '@/lib/auth-client';
import { cn } from '@/lib/utils';
import { config } from '@/site-config';

interface LoginFormProps extends React.ComponentProps<'div'> {}

export function LoginForm({ className, ...props }: LoginFormProps) {
  const thirdPartyLogins = false; // Might add 3rd-party login but not now!

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  async function handlePasskeyLogin() {
    setIsLoading(true);
    try {
      // https://www.better-auth.com/docs/plugins/passkey
      await authClient.signIn.passkey({
        // autoFill enables conditional UI but lots more needs to be done
        // autoFill: true,
      });
    } catch (error) {
      console.error('Passkey login error:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleMagicLinkLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      await magicLinkLogin({ email });
      setMagicLinkSent(true);
    } catch (error) {
      console.error('Magic link error:', error);
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
            Don&apos;t have an account? <Link href='/signup'>Sign up</Link>
          </FieldDescription>
        </div>
        <Field className='grid gap-4 sm:grid-cols-1 text-center'>
          <Button
            variant='outline'
            type='button'
            size='lg'
            onClick={handlePasskeyLogin}
            disabled={isLoading}
            className='h-12'
          >
            {isLoading ? (
              <Loader2 className='size-5 animate-spin' />
            ) : (
              <>
                <Fingerprint className='size-5' />
                Sign in with Passkey
              </>
            )}
          </Button>
          <FieldDescription>Use your device biometrics for instant access</FieldDescription>
        </Field>
        <FieldSeparator>OR</FieldSeparator>
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
                We sent a magic link to <span className='font-medium'>{email}</span>. Click the link to sign in.
              </FieldDescription>
              <Field>
                <Button variant='ghost' onClick={() => setMagicLinkSent(false)}>
                  Use a different email
                </Button>
              </Field>
            </FieldGroup>
          </div>
        ) : (
          <form className='space-y-4' onSubmit={handleMagicLinkLogin}>
            <Field>
              <FieldLabel htmlFor='email'>Email</FieldLabel>
              <Input
                id='email'
                type='email'
                placeholder='chris.johnson@contoso.com'
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </Field>
            <Field>
              <Button type='submit' variant='secondary' disabled={isLoading || !email} size='lg'>
                {isLoading ? (
                  <Loader2 className='size-5 animate-spin' />
                ) : (
                  <>
                    <Mail className='size-5' />
                    Send magic link
                  </>
                )}
              </Button>
            </Field>
          </form>
        )}
        {/* Might add 3rd-party login but not now! */}
        {thirdPartyLogins ? (
          <>
            <FieldSeparator>Or</FieldSeparator>
            <Field className='grid gap-4 sm:grid-cols-2'>
              <Button variant='outline' type='button' disabled>
                <AppleLogo className='size-4' />
                Continue with Apple
              </Button>
              <Button variant='outline' type='button' disabled>
                <GoogleLogo className='size-4' />
                Continue with Google
              </Button>
            </Field>
          </>
        ) : null}
      </FieldGroup>
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
