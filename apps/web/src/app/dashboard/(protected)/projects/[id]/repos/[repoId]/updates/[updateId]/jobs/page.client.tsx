'use client';

import { MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React from 'react';
import { requestTriggerUpdateJobs } from '@/actions/repositories';
import { EcosystemIcon, UpdateJobStatusIcon } from '@/components/icons';
import { TimeAgo } from '@/components/time-ago';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from '@/components/ui/item';
import { Separator } from '@/components/ui/separator';
import { getPullRequestUrl, getRepositoryFileUrl } from '@/lib/organizations';
import type { Organization, Project, Repository, RepositoryUpdate, UpdateJob } from '@/lib/prisma';
import { trimLeadingSlash } from '@/lib/utils';

type SimpleProject = Pick<Project, 'id' | 'name' | 'organizationId'> & {
  organization: Pick<Organization, 'type'>;
};
type SimpleRepository = Pick<
  Repository,
  'id' | 'name' | 'slug' | 'url' | 'updatedAt' | 'synchronizationStatus' | 'synchronizedAt'
>;
type SimpleRepositoryUpdate = Pick<RepositoryUpdate, 'id' | 'updatedAt' | 'ecosystem' | 'files'>;
type SimpleJob = Pick<UpdateJob, 'id' | 'status' | 'createdAt' | 'finishedAt' | 'errors' | 'affectedPrIds'>;

export function UpdateJobsView({
  project,
  repository,
  update,
  jobs,
}: {
  project: SimpleProject;
  repository: SimpleRepository;
  update: SimpleRepositoryUpdate;
  jobs: SimpleJob[];
}) {
  const organizationType = project.organization.type;
  const latestUpdateJob = jobs.at(0);

  const fileLinks: Map<string, string> = new Map(
    update.files.map((file) => [
      file,
      getRepositoryFileUrl({
        type: organizationType,
        url: repository.url,
        file,
      }),
    ]),
  );

  const prLinks: Map<number, string> = new Map(
    jobs.flatMap((job) =>
      job.affectedPrIds.map((prId) => [
        prId,
        getPullRequestUrl({
          type: organizationType,
          url: repository.url,
          prId,
        }),
      ]),
    ),
  );

  const router = useRouter();

  async function handleCheckForUpdates() {
    await requestTriggerUpdateJobs({
      organizationId: project.organizationId,
      projectId: project.id,
      repositoryId: repository.id,
      repositoryUpdateId: update.id,
      trigger: 'manual',
    });

    // redirect back to the repository page
    router.push(`/dashboard/projects/${project.id}/repos/${repository.id}?triggeredUpdateId=${update.id}`);
  }

  return (
    <div className='p-6 w-full max-w-5xl mx-auto space-y-6'>
      <div>
        <h1 className='text-2xl font-semibold mb-2'>Repository: {repository.name}</h1>
        <p className='text-muted-foreground text-sm'>
          <a href={repository.url} target='_blank' rel='noreferrer' className='hover:underline underline-offset-4'>
            {repository.slug}
          </a>
        </p>
      </div>

      <ItemGroup>
        <Item variant='outline'>
          <ItemMedia variant='icon'>
            <EcosystemIcon ecosystem={update.ecosystem} className='size-5' />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>
              {update.files.length ? (
                <div className='flex flex-row gap-2 items-center'>
                  <a
                    className='hover:underline hover:cursor-pointer underline-offset-4'
                    href={fileLinks.get(update.files[0]!)}
                    target='_blank'
                    rel='noreferrer'
                  >
                    {trimLeadingSlash(update.files[0]!)}
                  </a>
                  {update.files.length > 1 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant='ghost' size='icon'>
                          <MoreHorizontal className='size-4' />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuLabel className='text-xs font-light'>Monitored files</DropdownMenuLabel>
                        {update.files.slice(1).map((file) => (
                          <DropdownMenuItem key={file} asChild>
                            <a href={fileLinks.get(file)} target='_blank' rel='noreferrer'>
                              {trimLeadingSlash(file)}
                            </a>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              ) : (
                <>Updating ...</>
              )}
            </ItemTitle>
          </ItemContent>
          <ItemActions>
            {/* If there are a lot of updates running, this might block any manual request which should not be a big issue */}
            {!latestUpdateJob || latestUpdateJob.status === 'scheduled' || latestUpdateJob.status === 'running' ? (
              <>Running version update job now</>
            ) : (
              <Button size='sm' onClick={handleCheckForUpdates}>
                Check for updates
              </Button>
            )}
          </ItemActions>
        </Item>
      </ItemGroup>

      <ItemGroup className='bg-muted/50 rounded-md'>
        <Item>
          <ItemContent>
            <ItemTitle>Recent Jobs</ItemTitle>
          </ItemContent>
        </Item>
        {jobs.map((job) => (
          <React.Fragment key={job.id}>
            <ItemSeparator />
            <Item>
              <ItemMedia key={job.id} variant='image'>
                <UpdateJobStatusIcon status={job.status} className='size-5' />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>Version update {job.id}</ItemTitle>
                <ItemDescription>
                  {(job.status === 'running' || job.status === 'scheduled') && <>Running ...</>}
                  {job.status === 'failed' && (
                    // TODO: improve this UI
                    <>
                      Failed with {(job.errors.length || 0) > 1 ? 'errors' : 'an error'}:{' '}
                      <ul className='list-disc list-inside'>
                        {job.errors.map((error, index) => (
                          // biome-ignore lint/suspicious/noArrayIndexKey: no other id available
                          <li key={index}>
                            {error['error-type']}
                            {error['error-details'] ? `: ${JSON.stringify(error['error-details'])}` : ''}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </ItemDescription>
                {job.status !== 'running' && job.status !== 'scheduled' && (
                  <div className='flex flex-row gap-2 h-5 items-center'>
                    {job.affectedPrIds.length === 0 && <>No PRs Affected</>}
                    {job.affectedPrIds.length > 0 && (
                      <>
                        Affected{' '}
                        <a
                          href={prLinks.get(job.affectedPrIds[0]!)}
                          target='_blank'
                          rel='noreferrer'
                          className='hover:underline underline-offset-4 text-blue-500'
                        >
                          #{job.affectedPrIds[0]!}
                        </a>
                        {job.affectedPrIds.length > 1 && (
                          <>
                            {' and '}
                            {job.affectedPrIds.length - 1} more
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant='ghost' size='icon-sm'>
                                  <MoreHorizontal className='size-4' />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuLabel className='text-xs font-light'>PRs Affected</DropdownMenuLabel>
                                {job.affectedPrIds.slice(1).map((prId) => (
                                  <DropdownMenuItem key={prId} asChild>
                                    <a href={prLinks.get(prId)} target='_blank' rel='noreferrer'>
                                      #{prId}
                                    </a>
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </>
                        )}
                      </>
                    )}
                    <Separator orientation='vertical' />
                    <TimeAgo value={job.finishedAt ?? job.createdAt} />
                    <Separator orientation='vertical' />
                    <Link
                      href={`/dashboard/runs/${job.id}`}
                      className='hover:underline underline-offset-4 text-blue-500'
                    >
                      view logs
                    </Link>
                  </div>
                )}
              </ItemContent>
            </Item>
          </React.Fragment>
        ))}
      </ItemGroup>
    </div>
  );
}
