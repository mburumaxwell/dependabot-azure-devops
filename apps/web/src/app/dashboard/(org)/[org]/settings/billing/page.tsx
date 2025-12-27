import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { INCLUDED_USAGE_MINUTES } from '@/lib/stripe';
import { ManageSection, RegionSection, UsageSection } from './page.client';

export async function generateMetadata(props: PageProps<'/dashboard/[org]/settings/billing'>): Promise<Metadata> {
  const { org: organizationSlug } = await props.params;
  const organization = await getOrganization(organizationSlug);
  if (!organization) return notFound();

  return {
    title: 'Billing',
    description: 'Manage your organization billing settings',
    openGraph: { url: `/dashboard/${organizationSlug}/settings/billing` },
  };
}

export default async function BillingPage(props: PageProps<'/dashboard/[org]/settings/billing'>) {
  const { org: organizationSlug } = await props.params;
  const organization = await getOrganization(organizationSlug);
  if (!organization) return notFound();

  const period = organization.billingPeriod;
  const aggregate = period
    ? await prisma.updateJob.aggregate({
        where: {
          organizationId: organization.id,
          createdAt: { gte: period.start, lte: period.end },
          duration: { not: null },
        },
        _sum: { duration: true },
      })
    : { _sum: { duration: 0 } };
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

function getOrganization(slug: string) {
  return prisma.organization.findUnique({ where: { slug } });
}
