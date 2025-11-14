import type { Metadata } from 'next';
import { headers as requestHeaders } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { BillingEmailSection, CapacitySection, InvoicesSection, TierSection } from './page.client';

export const metadata: Metadata = {
  title: 'Billing',
  description: 'Manage your organization billing settings',
  openGraph: { url: `/dashboard/settings/billing` },
};

export default async function BillingPage() {
  const headers = await requestHeaders();
  const session = await auth.api.getSession({ headers });
  if (!session || !session.session.activeOrganizationId) return null;

  const organizationId = session.session.activeOrganizationId;
  const organization = await prisma.organization.findUniqueOrThrow({
    where: { id: organizationId },
  });
  if (!organization) return null;

  return (
    <div className='p-6 w-full max-w-5xl mx-auto space-y-6'>
      <div>
        <h1 className='text-3xl font-semibold mb-2'>Billing</h1>
        <p className='text-muted-foreground'>Manage your billing settings and payment methods</p>
      </div>

      <TierSection organizationId={organization.id} currentTier={organization.tier} />
      <CapacitySection organizationId={organization.id} maxProjects={organization.maxProjects} />
      <BillingEmailSection organizationId={organization.id} billingEmail={organization.billingEmail || ''} />
      <InvoicesSection />
    </div>
  );
}
