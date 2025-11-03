'use client';

import { CheckCircle2, XCircle } from 'lucide-react';
import { redirect } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { authClient } from '@/lib/auth-client';

export function InviteDeclineView({ invitationId }: { invitationId: string }) {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [countdown, setCountdown] = useState(5);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const declineInvite = async () => {
      const { data, error } = await authClient.organization.rejectInvitation({ invitationId });
      if (error || !data) {
        setStatus('error');
        setErrorMessage(error?.message || 'Invitation does not exist or has already been responded to.');
        return;
      }

      setStatus('success');
    };

    declineInvite();
  }, [invitationId]);

  useEffect(() => {
    if (status === 'success' || status === 'error') {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            redirect('/');
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
      <Card className='w-full max-w-md'>
        <CardHeader className='text-center'>
          <div className='mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-muted'>
            {status === 'loading' && <Spinner className='size-8 text-muted-foreground' />}
            {status === 'success' && <CheckCircle2 className='size-8 text-orange-600' />}
            {status === 'error' && <XCircle className='size-8 text-destructive' />}
          </div>
          <CardTitle>
            {status === 'loading' && 'Declining Invite...'}
            {status === 'success' && 'Invite Declined'}
            {status === 'error' && 'Failed to Decline Invite'}
          </CardTitle>
          <CardDescription>
            {status === 'loading' && 'Please wait while we process your response.'}
            {status === 'success' && 'You have declined the organization invitation.'}
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
