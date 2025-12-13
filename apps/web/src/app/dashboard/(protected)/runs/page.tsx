import type { DependabotPackageManager } from '@paklo/core/dependabot';
import type { Metadata } from 'next';
import { headers as requestHeaders } from 'next/headers';
import { unauthorized } from 'next/navigation';
import { getDateTimeRange, type TimeRange } from '@/lib/aggregation';
import { auth } from '@/lib/auth';
import { unwrapWithAll, type WithAll } from '@/lib/enums';
import { prisma, type UpdateJobStatus, type UpdateJobTrigger } from '@/lib/prisma';
import RunsView from './page.client';

export const metadata: Metadata = {
  title: 'Runs',
  description: 'View your runs',
  openGraph: { url: `/dashboard/runs` },
};

export default async function RunsPage(props: PageProps<'/dashboard/runs'>) {
  const headers = await requestHeaders();
  const session = (await auth.api.getSession({ headers }))!;
  const organizationId = session.session.activeOrganizationId;
  if (!organizationId) {
    unauthorized();
  }

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
  const { start, end } = getDateTimeRange(timeRange);

  const project = unwrapWithAll(selectedProject);
  const status = unwrapWithAll(selectedStatus);
  const trigger = unwrapWithAll(selectedTrigger);
  const packageManager = unwrapWithAll(selectedPackageManager);
  const projects = await prisma.project.findMany({
    where: { organizationId },
    select: { id: true, name: true },
  });

  const jobs = await prisma.updateJob.findMany({
    where: {
      organizationId, // must belong to the active organization
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
    <div className='p-6 w-full max-w-5xl mx-auto space-y-6'>
      <div>
        <h1 className='text-3xl font-semibold mb-2'>Update Jobs</h1>
        <p className='text-muted-foreground'>Monitor and track dependency update jobs across your repositories</p>
      </div>
      <RunsView projects={projects} jobs={jobs} />
    </div>
  );
}
