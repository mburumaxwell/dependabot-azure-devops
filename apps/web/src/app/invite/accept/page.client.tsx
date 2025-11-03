'use client';

import { CheckCircle2, XCircle } from 'lucide-react';
import { redirect } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { authClient } from '@/lib/auth-client';

export function InviteAcceptView({ invitationId }: { invitationId: string }) {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [countdown, setCountdown] = useState(5);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const acceptInvite = async () => {
      const { data, error } = await authClient.organization.acceptInvitation({ invitationId });

      if (error || !data) {
        setStatus('error');
        setErrorMessage(error?.message || 'Failed to accept invitation');
        return;
      }

      setStatus('success');
    };

    acceptInvite();
  }, [invitationId]);

  useEffect(() => {
    if (status === 'success' || status === 'error') {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            redirect(status === 'success' ? '/dashboard' : '/dashboard/account');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [status]);

  return (
    <div className='flex min-h-screen items-center justify-center p-4'>
      <Card className='w-full max-w-sm'>
        <CardHeader className='text-center'>
          <div className='mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-muted'>
            {status === 'loading' && <Spinner className='size-8 text-muted-foreground' />}
            {status === 'success' && <CheckCircle2 className='size-8 text-green-600' />}
            {status === 'error' && <XCircle className='size-8 text-destructive' />}
          </div>
          <CardTitle>
            {status === 'loading' && 'Accepting Invite...'}
            {status === 'success' && 'Invite Accepted!'}
            {status === 'error' && 'Failed to Accept Invite'}
          </CardTitle>
          <CardDescription>
            {status === 'loading' && 'Please wait while we process your invitation.'}
            {status === 'success' && 'You have successfully joined the organization.'}
            {status === 'error' && errorMessage}
          </CardDescription>
        </CardHeader>
        {(status === 'success' || status === 'error') && (
          <CardContent className='text-center'>
            <p className='text-sm text-muted-foreground'>
              Redirecting in {countdown} second{countdown !== 1 ? 's' : ''}...
            </p>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
