import type { DependabotPackageManager } from '@paklo/core/dependabot';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDateFromTimeRange, type TimeRange } from '@/lib/aggregation';
import type { UpdateJobStatus, UpdateJobTrigger } from '@/lib/enums';
import { unwrapWithAll, type WithAll } from '@/lib/enums';
import { prisma } from '@/lib/prisma';
import RunsView from './page.client';

export async function generateMetadata(props: PageProps<'/dashboard/[org]/runs'>): Promise<Metadata> {
  const { org } = await props.params;
  return {
    title: 'Runs',
    description: 'View your runs',
    openGraph: { url: `/dashboard/${org}/runs` },
  };
}

export default async function RunsPage(props: PageProps<'/dashboard/[org]/runs'>) {
  const { org: organizationSlug } = await props.params;

  const searchParams = (await props.searchParams) as {
    timeRange?: TimeRange;
    project?: WithAll<string>;
    status?: WithAll<UpdateJobStatus>;
    trigger?: WithAll<UpdateJobTrigger>;
    packageManager?: WithAll<DependabotPackageManager>;
  };
  const {
    timeRange = '24h',
    project: selectedProject,
    status: selectedStatus,
    trigger: selectedTrigger,
    packageManager: selectedPackageManager,
  } = searchParams;
  const { start, end } = getDateFromTimeRange(timeRange);

  const project = unwrapWithAll(selectedProject);
  const status = unwrapWithAll(selectedStatus);
  const trigger = unwrapWithAll(selectedTrigger);
  const packageManager = unwrapWithAll(selectedPackageManager);
  const organization = await prisma.organization.findUnique({
    where: { slug: organizationSlug },
  });
  if (!organization) return notFound();

  const projects = await prisma.project.findMany({
    where: { organizationId: organization.id },
    select: { id: true, name: true },
  });

  const jobs = await prisma.updateJob.findMany({
    where: {
      organizationId: organization.id, // must belong to the active organization
      createdAt: { gte: start, lte: end },
      ...(project ? { projectId: project } : {}),
      ...(status ? { status } : {}),
      ...(trigger ? { trigger } : {}),
      ...(packageManager ? { packageManager } : {}),
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      createdAt: true,
      projectId: true,
      packageManager: true,
      ecosystem: true,
      status: true,
      trigger: true,
      repositorySlug: true,
      duration: true,
    },
  });

  return (
    <div className='mx-auto w-full max-w-5xl space-y-6 p-6'>
      <div>
        <h1 className='mb-2 font-semibold text-3xl'>Update Jobs</h1>
        <p className='text-muted-foreground'>Monitor and track dependency update jobs across your repositories</p>
      </div>
      <RunsView organization={organization} projects={projects} jobs={jobs} />
    </div>
  );
}
