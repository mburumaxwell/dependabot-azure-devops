'use client';

import { ArrowUpRightIcon, Calendar, ChevronRightIcon, Folder, FolderGit2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SynchronizationStatusBadge } from '@/components/icons';
import { TimeAgo } from '@/components/time-ago';
import { Button } from '@/components/ui/button';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from '@/components/ui/item';
import type { Project } from '@/lib/prisma';

type SimpleProject = Pick<Project, 'id' | 'name' | 'url' | 'synchronizationStatus' | 'synchronizedAt'>;
export function ProjectsView({ projects }: { projects: SimpleProject[] }) {
  const router = useRouter();

  async function handleConnectProjects() {
    router.push('/dashboard/projects/connect');
  }

  return (
    <>
      {projects.length === 0 ? (
        <div className='p-6 w-full max-w-5xl mx-auto space-y-6 min-h-screen flex'>
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant='icon'>
                <Folder />
              </EmptyMedia>
              <EmptyTitle>No Projects Yet</EmptyTitle>
              <EmptyDescription>
                You haven&apos;t connected any projects yet. Get started by connecting your first project.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <div className='flex gap-2'>
                <Button onClick={handleConnectProjects}>Connect Projects</Button>
              </div>
            </EmptyContent>
            <Button variant='link' asChild className='text-muted-foreground' size='sm'>
              <a href='/docs/getting-started/projects' target='_blank' rel='noreferrer'>
                Learn More <ArrowUpRightIcon />
              </a>
            </Button>
          </Empty>
        </div>
      ) : (
        <div className='p-6 w-full max-w-5xl mx-auto space-y-6'>
          <div className='grid gap-4 grid-cols-1 md:grid-cols-3 items-center justify-center'>
            <div className='md:col-span-2'>
              <h1 className='text-3xl font-semibold mb-2'>Projects</h1>
              <p className='text-muted-foreground'>
                Manage and monitor your connected projects. Keep track of synchronization status and recent activity.
              </p>
            </div>
            <Button onClick={handleConnectProjects} className='mt-4 md:w-full lg:mt-0 lg:justify-self-end lg:w-auto'>
              Connect Projects
            </Button>
          </div>

          <ItemGroup className='space-y-4'>
            {projects.map((project) => (
              <Item key={project.id} variant='outline' asChild>
                <Link href={`/dashboard/projects/${project.id}`}>
                  <ItemMedia variant='icon'>
                    <FolderGit2 className='size-5' />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>
                      {project.name}
                      <SynchronizationStatusBadge status={project.synchronizationStatus} className='gap-1' />
                    </ItemTitle>
                    <ItemDescription>
                      <span>{project.url}</span>
                      {project.synchronizedAt && (
                        <span className='flex items-center gap-1'>
                          <Calendar className='size-3' />
                          Last synchronized: <TimeAgo value={project.synchronizedAt} />
                        </span>
                      )}
                    </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <ChevronRightIcon className='size-4' />
                  </ItemActions>
                </Link>
              </Item>
            ))}
          </ItemGroup>
        </div>
      )}
    </>
  );
}
