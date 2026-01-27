import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { InfoSection, LogsSection } from './page.client';

export async function generateMetadata(props: PageProps<'/dashboard/[org]/runs/[id]'>): Promise<Metadata> {
  const { org: organizationSlug, id } = await props.params;
  const { organization, job } = await getUpdateJob({ organizationSlug, id });
  if (!organization || !job) return notFound();

  return {
    title: `Update job - ${job.id}`,
    description: `View update job logs`,
    openGraph: { url: `/dashboard/${organizationSlug}/runs/${id}` },
  };
}

export default async function RunPage(props: PageProps<'/dashboard/[org]/runs/[id]'>) {
  const { org: organizationSlug, id } = await props.params;
  const { organization, job } = await getUpdateJob({ organizationSlug, id });
  if (!organization || !job) return notFound();

  return (
    <div className='mx-auto w-full max-w-5xl space-y-6 p-6'>
      <InfoSection job={job} />
      <LogsSection organization={organization} job={job} />
    </div>
  );
}

async function getUpdateJob({ organizationSlug, id }: { organizationSlug: string; id: string }) {
  const organization = await prisma.organization.findUnique({
    where: { slug: organizationSlug },
    select: { id: true, slug: true },
  });
  if (!organization) return { organization: null, job: null };

  const job = await prisma.updateJob.findUnique({
    // must belong to an organization they are a member of (the active one)
    where: { organizationId: organization.id, id },
    select: {
      id: true,
      ecosystem: true,
      repositorySlug: true,
      trigger: true,
      status: true,
      region: true,
      createdAt: true,
      startedAt: true,
      finishedAt: true,
      duration: true,
    },
  });

  return { organization, job };
}
