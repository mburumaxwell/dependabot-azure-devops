import type { Metadata } from 'next';
import { headers as requestHeaders } from 'next/headers';
import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

  // TODO: implement this page
  return (
    <div className='flex flex-1 flex-col gap-4 p-4'>
      <div className='grid auto-rows-min gap-4 md:grid-cols-3'>
        <div className='bg-muted/50 aspect-video rounded-xl' />
        <div className='bg-muted/50 aspect-video rounded-xl' />
        <div className='bg-muted/50 aspect-video rounded-xl' />
      </div>
      <div className='bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min' />
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
    },
  });

  return { job };
}
