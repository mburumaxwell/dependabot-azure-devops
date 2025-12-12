import type { Metadata } from 'next';
import { headers as requestHeaders } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { INCLUDED_USAGE_MINUTES } from '@/lib/stripe';
import { ManageSection, RegionSection, UsageSection } from './page.client';

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
  if (!organizationId) return null;
  const organization = await prisma.organization.findUniqueOrThrow({
    where: { id: organizationId },
  });

  const aggregate = await prisma.updateJob.aggregate({
    where: {
      organizationId: organization.id,
      duration: { not: null },
    },
    _sum: { duration: true },
  });
  const consumed = (aggregate._sum.duration || 0) / 60_000; // convert from milliseconds to minutes
  const usage = { consumed, included: INCLUDED_USAGE_MINUTES };

  const projects = await prisma.project.count({
    where: { organizationId: organization.id },
  });

  return (
    <div className='p-6 w-full max-w-5xl mx-auto space-y-6'>
      <div>
        <h1 className='text-3xl font-semibold mb-2'>Billing</h1>
        <p className='text-muted-foreground'>Manage your billing settings and payment methods</p>
      </div>

      <ManageSection organization={organization} projects={projects} />
      <UsageSection usage={usage} />
      <RegionSection organization={organization} />
    </div>
  );
}
