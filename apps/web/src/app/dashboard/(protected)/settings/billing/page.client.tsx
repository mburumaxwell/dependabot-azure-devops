'use client';

import { Check, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { updateBillingEmail, updateMaxProjects, updateTier } from '@/actions/organizations';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { getOrganizationTierInfo } from '@/lib/organizations';
import type { OrganizationTier } from '@/lib/prisma';

export function TierSection({
  organizationId,
  currentTier: initialCurrentTier,
}: {
  organizationId: string;
  currentTier: OrganizationTier;
}) {
  const [currentTier, setCurrentTier] = useState(initialCurrentTier);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<OrganizationTier>('free');
  const [isUpgrading, setIsUpgrading] = useState(false);

  function handleTierSelect(tier: OrganizationTier) {
    if (tier === 'enterprise') {
      toast.info('Coming soon', {
        description: 'Enterprise tier is something in the thinking stage and may be available soon.',
      });
      return;
    }

    const tierOrder = { free: 0, pro: 1, enterprise: 2 };
    if (tierOrder[tier] < tierOrder[currentTier]) {
      toast.error('Cannot downgrade', {
        description: 'Tier downgrades are not supported. Please contact support if you need assistance.',
      });
      return;
    }

    if (tier === currentTier) return;
    setSelectedTier(tier);
    setIsDialogOpen(true);
  }

  async function handleConfirmUpgrade() {
    setIsUpgrading(true);
    const { success, error } = await updateTier({
      organizationId,
      tier: selectedTier,
    });
    setIsUpgrading(false);
    setIsDialogOpen(false);
    if (!success) {
      toast.error('Error upgrading tier', { description: error?.message });
      return;
    }

    setCurrentTier(selectedTier);
    toast.success('Tier upgraded', {
      description: `Successfully upgraded to ${getOrganizationTierInfo(selectedTier).name} tier.`,
    });
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Subscription Tier</CardTitle>
          <CardDescription>
            Choose the plan that works for you.{' '}
            <Link href='/#pricing' className='text-primary hover:underline inline-flex items-center gap-1'>
              Compare pricing <ExternalLink className='size-3' />
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid gap-4 md:grid-cols-3'>
            {/* Free Tier */}
            <button
              type='button'
              onClick={() => handleTierSelect('free')}
              className={`relative p-6 border-2 rounded-lg text-left transition-all ${
                currentTier === 'free' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
              }`}
            >
              {currentTier === 'free' && (
                <Badge className='absolute top-4 right-4' variant='default'>
                  Current
                </Badge>
              )}
              <div className='space-y-2'>
                <h3 className='text-lg font-semibold'>Free</h3>
                <p className='text-2xl font-bold'>$0</p>
                <p className='text-sm text-muted-foreground'>per project per month</p>
                <ul className='space-y-2 text-sm pt-4'>
                  <li className='flex items-start gap-2'>
                    <Check className='size-4 text-primary mt-0.5' />
                    <span>Up to 3 projects</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <Check className='size-4 text-primary mt-0.5' />
                    <span>Basic support</span>
                  </li>
                </ul>
              </div>
            </button>

            {/* Pro Tier */}
            <button
              type='button'
              onClick={() => handleTierSelect('pro')}
              className={`relative p-6 border-2 rounded-lg text-left transition-all ${
                currentTier === 'pro' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
              }`}
            >
              {currentTier === 'pro' && (
                <Badge className='absolute top-4 right-4' variant='default'>
                  Current
                </Badge>
              )}
              <div className='space-y-2'>
                <h3 className='text-lg font-semibold'>Pro</h3>
                <p className='text-2xl font-bold'>$49</p>
                <p className='text-sm text-muted-foreground'>per project per month</p>
                <ul className='space-y-2 text-sm pt-4'>
                  <li className='flex items-start gap-2'>
                    <Check className='size-4 text-primary mt-0.5' />
                    <span>Unlimited projects</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <Check className='size-4 text-primary mt-0.5' />
                    <span>Priority support</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <Check className='size-4 text-primary mt-0.5' />
                    <span>Advanced analytics</span>
                  </li>
                </ul>
              </div>
            </button>

            {/* Enterprise Tier (Coming Soon) */}
            <button
              type='button'
              onClick={() => handleTierSelect('enterprise')}
              className='relative p-6 border-2 rounded-lg text-left transition-all border-border opacity-60 cursor-not-allowed'
            >
              <Badge className='absolute top-4 right-4' variant='secondary'>
                Researching ...
              </Badge>
              <div className='space-y-2 blur-[2px]'>
                <h3 className='text-lg font-semibold'>Enterprise</h3>
                <p className='text-2xl font-bold'>Custom</p>
                <p className='text-sm text-muted-foreground'>contact sales</p>
                <ul className='space-y-2 text-sm pt-4'>
                  <li className='flex items-start gap-2'>
                    <Check className='size-4 text-primary mt-0.5' />
                    <span>Custom integrations</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <Check className='size-4 text-primary mt-0.5' />
                    <span>Dedicated support</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <Check className='size-4 text-primary mt-0.5' />
                    <span>SLA guarantees</span>
                  </li>
                </ul>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Confirmation Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upgrade to {getOrganizationTierInfo(selectedTier).name}?</DialogTitle>
            <DialogDescription>
              You're about to upgrade from {getOrganizationTierInfo(currentTier).name} to{' '}
              {getOrganizationTierInfo(selectedTier).name}. This change will take effect immediately and your billing
              will be updated accordingly.
            </DialogDescription>
          </DialogHeader>
          <div className='py-4'>
            <p className='text-sm text-muted-foreground'>
              By upgrading, you'll get access to all {selectedTier} tier features. You can view the full comparison on
              our{' '}
              <Link href='/#pricing' className='text-primary hover:underline'>
                pricing page
              </Link>
              .
            </p>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setIsDialogOpen(false)} disabled={isUpgrading}>
              Cancel
            </Button>
            <Button onClick={handleConfirmUpgrade} disabled={isUpgrading}>
              {isUpgrading ? (
                <>
                  <Spinner className='mr-2' />
                  Upgrading...
                </>
              ) : (
                'Confirm upgrade'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function CapacitySection({
  organizationId,
  maxProjects: initialMaxProjects,
}: {
  organizationId: string;
  maxProjects: number;
}) {
  const [maxProjects, setMaxProjects] = useState(initialMaxProjects);
  const [value, setValue] = useState(maxProjects);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSaveProjects() {
    setIsSaving(true);
    const { success, error } = await updateMaxProjects({
      organizationId,
      maxProjects: value,
    });
    setIsSaving(false);
    if (!success) {
      toast.error('Error updating projects', { description: error?.message });
      return;
    }

    setMaxProjects(value);
    toast.success('Projects updated', { description: 'Your project count has been updated successfully.' });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Projects</CardTitle>
        <CardDescription>
          Adjust the number of projects for your organization.{' '}
          <Link href='/#pricing' className='text-primary hover:underline inline-flex items-center gap-1'>
            See pricing details <ExternalLink className='size-3' />
          </Link>
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='space-y-2'>
          <Label htmlFor='projects'>Number of projects</Label>
          <Input
            id='projects'
            type='number'
            value={value}
            onChange={(e) => setValue(Number.parseInt(e.target.value, 10) || 1)}
            min={1}
          />
          <p className='text-xs text-muted-foreground'>Each project costs $1/month</p>
        </div>
        <div className='flex justify-end'>
          <Button onClick={handleSaveProjects} disabled={isSaving || value === maxProjects}>
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
