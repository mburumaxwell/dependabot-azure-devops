import type { Metadata } from 'next';
import { headers as requestHeaders } from 'next/headers';
import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { InfoSection, LogsSection } from './page.client';

export async function generateMetadata(props: PageProps<'/dashboard/runs/[id]'>): Promise<Metadata> {
  const { id } = await props.params;
  const { job } = await getUpdateJob({ id });
  if (!job) {
    notFound();
  }

  return {
    title: `Update job - ${job.id}`,
    description: `View update job logs`,
    openGraph: { url: `/dashboard/runs/${id}` },
  };
}

export default async function RunPage(props: PageProps<'/dashboard/runs/[id]'>) {
  const { id } = await props.params;
  const { job } = await getUpdateJob({ id });
  if (!job) {
    notFound();
  }

  return (
    <div className='p-6 w-full max-w-5xl mx-auto space-y-6'>
      <InfoSection job={job} />
      <LogsSection job={job} />
    </div>
  );
}

async function getUpdateJob({ id }: { id: string }) {
  const headers = await requestHeaders();
  const session = (await auth.api.getSession({ headers }))!;
  const organizationId = session.session.activeOrganizationId;
  if (!organizationId) {
    return { job: undefined };
  }

  const job = await prisma.updateJob.findUnique({
    // must belong to an organization they are a member of (the active one)
    where: { organizationId, id },
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

  return { job };
}
