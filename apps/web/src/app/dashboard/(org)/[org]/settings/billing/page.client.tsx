'use client';

import { loadStripe } from '@stripe/stripe-js';
import { AlertTriangle, CreditCard, Gauge, Server } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  cancelSubscription,
  createStripeBillingPortalSession,
  createStripeCheckoutSession,
  updateOrganizationRegion,
} from '@/actions/organizations';
import { RegionsSelect } from '@/components/regions-select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/components/ui/item';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import type { Organization } from '@/lib/prisma';

type SimpleOrganization = Pick<Organization, 'id' | 'region' | 'subscriptionId' | 'subscriptionStatus'>;
export function ManageSection({ organization, projects }: { organization: SimpleOrganization; projects: number }) {
  const [isHandlingSetup, setIsHandlingSetup] = useState(false);
  const [isHandlingManage, setIsHandlingManage] = useState(false);
  const [isHandlingCancel, setIsHandlingCancel] = useState(false);
  const [cancelFeedback, setCancelFeedback] = useState('');
  const router = useRouter();

  async function handleSetupBilling() {
    setIsHandlingSetup(true);
    const { url, error } = await createStripeCheckoutSession({ organizationId: organization.id });
    setIsHandlingSetup(false);
    if (error) {
      toast.error('Error creating checkout session', { description: error.message });
      return;
    }

    const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
    if (!stripe) {
      toast.error('Error loading Stripe');
      return;
    }

    toast.success('Redirecting to Stripe Checkout', { description: 'You will be redirected shortly.' });
    window.location.href = url!;
  }

  async function handleManageBilling() {
    setIsHandlingManage(true);
    const { url, error } = await createStripeBillingPortalSession({ organizationId: organization.id });
    setIsHandlingManage(false);
    if (error) {
      toast.error('Error creating billing portal session', { description: error.message });
      return;
    }

    toast.success('Redirecting to Stripe Billing Portal', { description: 'You will be redirected shortly.' });
    window.location.href = url!;
  }

  async function handleCancelBilling() {
    setIsHandlingCancel(true);
    const { success, error } = await cancelSubscription({ organizationId: organization.id, feedback: cancelFeedback });
    setIsHandlingCancel(false);
    setCancelFeedback('');
    if (!success || error) {
      toast.error('Error cancelling subscription', { description: error?.message });
      return;
    }

    router.push('/dashboard');
  }

  const hasBilling = Boolean(organization.subscriptionId);
  const isHandling = isHandlingSetup || isHandlingManage || isHandlingCancel;

  return (
    <Item variant='outline'>
      <ItemMedia variant='icon'>
        <CreditCard className='size-5' />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>Billing information</ItemTitle>
        <ItemDescription>We use Stripe for secure payment processing and billing management.</ItemDescription>
      </ItemContent>
      <ItemActions>
        {hasBilling ? (
          <>
            <Button onClick={handleManageBilling} disabled={isHandling} size='sm'>
              {isHandlingManage ? (
                <>
                  <Spinner className='mr-2' />
                  Redirecting...
                </>
              ) : (
                'Manage'
              )}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild disabled={isHandling}>
                <Button variant='destructive' size='sm'>
                  {isHandlingCancel ? (
                    <>
                      <Spinner className='mr-2' />
                      Cancelling...
                    </>
                  ) : (
                    'Cancel'
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cancelling your subscription will stop future billing.
                    {projects > 0 && (
                      <>
                        <br />
                        You must disconnect all projects from this organization before cancelling.
                      </>
                    )}
                    <div className='space-y-2 pt-2'>
                      <Label htmlFor='cancel-feedback' className='text-sm font-normal text-foreground'>
                        Help us improve (optional)
                      </Label>
                      <Textarea
                        id='cancel-feedback'
                        value={cancelFeedback}
                        onChange={(e) => setCancelFeedback(e.target.value)}
                        placeholder='Why are you cancelling? Your feedback helps us improve...'
                        className='w-full min-h-20 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none'
                        disabled={isHandlingCancel}
                      />
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isHandlingCancel}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className='bg-destructive'
                    onClick={handleCancelBilling}
                    disabled={projects > 0 || isHandlingCancel}
                  >
                    Cancel subscription
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        ) : (
          <Button onClick={handleSetupBilling} disabled={isHandling} size='sm'>
            {isHandlingSetup ? (
              <>
                <Spinner className='mr-2' />
                Setting up...
              </>
            ) : (
              'Setup'
            )}
          </Button>
        )}
      </ItemActions>
      {hasBilling && organization.subscriptionStatus === 'past_due' && (
        <Alert variant='destructive'>
          <AlertTriangle className='size-4' />
          <AlertDescription>
            Your subscription is currently past due. Please update your payment information to continue service.
          </AlertDescription>
        </Alert>
      )}
    </Item>
  );
}

export function UsageSection({ usage: { consumed, included } }: { usage: { consumed: number; included: number } }) {
  const percentage = Math.min((consumed / included) * 100, 100);

  return (
    <Item variant='outline'>
      <ItemMedia variant='icon'>
        <Gauge className='size-5' />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>Usage</ItemTitle>
        <ItemDescription>Total job runtime in minutes</ItemDescription>
        <div className='space-y-2'>
          <div className='flex items-end gap-2'>
            <span className='font-bold'>{consumed.toFixed(0)}</span>
            <span className='text-muted-foreground'> of {included} included</span>
          </div>
          <Progress value={percentage} className='h-2' />
          <div className='flex items-center justify-between text-sm'>
            <span className='text-muted-foreground'>{percentage.toFixed(0)}% used</span>
            <Badge variant='secondary'>{Math.max(included - consumed, 0).toFixed(0)} minutes remaining</Badge>
          </div>
          <div className='text-muted-foreground'>
            Extra usage beyond included will be billed. See{' '}
            <Link href='/#pricing' target='_blank' rel='noopener noreferrer' className='underline underline-offset-4'>
              pricing page
            </Link>{' '}
            for details.
          </div>
        </div>
      </ItemContent>
    </Item>
  );
}

export function RegionSection({ organization: initialOrganization }: { organization: SimpleOrganization }) {
  const [organization, setOrganization] = useState(initialOrganization);
  const [selectedRegion, setSelectedRegion] = useState(organization.region);
  const [isSavingRegion, setIsSavingRegion] = useState(false);

  async function handleSaveRegion() {
    setIsSavingRegion(true);
    const { success, error } = await updateOrganizationRegion({
      organizationId: organization.id,
      region: selectedRegion,
    });
    setIsSavingRegion(false);
    if (!success || error) {
      toast.error('Error updating region', { description: error?.message });
      return;
    }
    setOrganization((prev) => ({ ...prev, region: selectedRegion }));
    toast.success('Region updated', { description: 'Your data region has been updated successfully.' });
  }

  return (
    <Item variant='outline'>
      <ItemMedia variant='icon'>
        <Server className='size-5' />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>Data Residency</ItemTitle>
        <ItemDescription>Choose where your organization's jobs will be run</ItemDescription>
        <RegionsSelect
          selected={selectedRegion}
          onValueChange={(value) => setSelectedRegion(value)}
          className='my-2'
          disabled={isSavingRegion}
        />
        <div className='flex justify-end'>
          <AlertDialog>
            <AlertDialogTrigger asChild disabled={isSavingRegion || selectedRegion === organization.region}>
              <Button size='sm'>
                {isSavingRegion ? (
                  <>
                    <Spinner className='mr-2' />
                    Saving...
                  </>
                ) : (
                  'Save changes'
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  Changing your data region may take some time as we migrate your existing data. New jobs will be run in
                  the selected region immediately, whereas secrets and other data may be migrated in the background.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isSavingRegion}>Cancel</AlertDialogCancel>
                <AlertDialogAction className='bg-destructive' onClick={handleSaveRegion} disabled={isSavingRegion}>
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </ItemContent>
    </Item>
  );
}
