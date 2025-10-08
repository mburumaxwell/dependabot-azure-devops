'use client';

import { KeyRound } from 'lucide-react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authenticate } from './actions';

export function LoginForm() {
  const [errorMessage, dispatch] = useActionState(authenticate, undefined);

  return (
    <Card className='w-full max-w-sm'>
      <CardHeader className='text-center'>
        <CardTitle>Usage Telemetry Login</CardTitle>
        <CardDescription>Enter password to access the page</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={dispatch} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='password'>Password</Label>
            <div className='relative'>
              <KeyRound className='absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400' />
              <Input id='password' name='password' type='password' placeholder='••••••••' required className='pl-10' />
            </div>
          </div>
          {errorMessage && <div className='text-sm font-medium text-red-500'>{errorMessage}</div>}
          <LoginButton />
        </form>
      </CardContent>
    </Card>
  );
}

function LoginButton() {
  const { pending } = useFormStatus();
  return (
    <Button type='submit' className='w-full' aria-disabled={pending}>
      {pending ? 'Logging in...' : 'Login'}
    </Button>
  );
}
