'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { updateBillingEmail } from '@/actions/organizations';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Spinner } from '@/components/ui/spinner';

export function UsageSection({ consumed, included }: { consumed: number; included: number }) {
  const percentage = Math.min((consumed / included) * 100, 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage</CardTitle>
        <CardDescription>Total job runtime in minutes</CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='flex items-end gap-2'>
          <span className='font-bold'>{consumed.toFixed(0)}</span>
          of
          <span className='text-muted-foreground'> {included} included</span>
        </div>
        <Progress value={percentage} className='h-2' />
        <div className='flex items-center justify-between text-sm'>
          <span className='text-muted-foreground'>{percentage.toFixed(0)}% used</span>
          <Badge variant='secondary'>{Math.max(included - consumed, 0).toFixed(0)} minutes remaining</Badge>
        </div>
        <div className='flex items-center justify-between text-sm'>
          <span className='text-muted-foreground'>
            Extra minutes beyond included will be billed at $0.005 per minute.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export function BillingEmailSection({
  organizationId,
  billingEmail: initialBillingEmail,
}: {
  organizationId: string;
  billingEmail: string;
}) {
  const [billingEmail, setBillingEmail] = useState(initialBillingEmail);
  const [value, setValue] = useState(initialBillingEmail);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveBillingEmail = async () => {
    setIsSaving(true);
    const { success, error } = await updateBillingEmail({
      organizationId,
      billingEmail: value,
    });
    setIsSaving(false);
    if (!success) {
      toast.error('Error updating email', { description: error?.message });
      return;
    }

    setBillingEmail(value);
    toast.success('Email updated', { description: 'Your billing email has been updated successfully.' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing Email</CardTitle>
        <CardDescription>Where invoices and billing notifications are sent</CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='space-y-2'>
          <Label htmlFor='billing-email'>Email address</Label>
          <Input id='billing-email' type='email' value={value} onChange={(e) => setValue(e.target.value)} />
        </div>
        <div className='flex justify-end'>
          <Button onClick={handleSaveBillingEmail} disabled={isSaving || value === billingEmail}>
            {isSaving ? (
              <>
                <Spinner className='mr-2' />
                Saving...
              </>
            ) : (
              'Save changes'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// TODO: implement this section
export function InvoicesSection() {
  return (
    <div>
      {/* Keep empty */}
      {/* Keep empty */}
    </div>
  );
}
