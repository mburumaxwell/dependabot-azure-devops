'use client';

import { AlertTriangle, Calendar, MoreHorizontalIcon, RefreshCw, Unplug } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { disconnectProject } from '@/actions/projects';
import { requestSync } from '@/actions/sync';
import { SynchronizationStatusBadge } from '@/components/sync-status-badge';
import { TimeAgo } from '@/components/time-ago';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Spinner } from '@/components/ui/spinner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Project, Repository } from '@/lib/prisma';
import { getNextManualSyncTime, isManualSyncAllowed } from '@/lib/sync';

type SimpleProject = Pick<
  Project,
  'id' | 'name' | 'url' | 'maxRepositories' | 'synchronizationStatus' | 'synchronizedAt' | 'organizationId'
>;
type SimpleRepository = Pick<Repository, 'id' | 'name' | 'updatedAt' | 'synchronizationStatus' | 'synchronizedAt'>;
export function RepositoriesView({
  project: initialProject,
  repositories,
}: {
  project: SimpleProject;
  repositories: SimpleRepository[];
}) {
  const router = useRouter();
  const [project, setProject] = useState(initialProject);

  async function handleSync(project: SimpleProject) {
    // TODO: pop a dialog to ask if they want to sync repositories as well (false by default) and if to trigger update jobs
    await requestSync({
      organizationId: project.organizationId,
      projectId: project.id,
      scope: 'project',
    });
    setProject((prev) => ({ ...prev, synchronizationStatus: 'pending' }));
  }

  async function handleDisconnect(project: SimpleProject) {
    try {
      await disconnectProject({ organizationId: project.organizationId, projectId: project.id });

      toast.success('Disconnected', {
        description: `Successfully disconnected project "${project.name}"`,
      });
      router.push('/dashboard/projects');
    } catch (error) {
      toast.error('Failed to disconnect project', {
        description: (error as Error).message,
      });
    }
  }

  return (
    <div className='p-6 w-full max-w-5xl mx-auto space-y-6'>
      {repositories.length >= project.maxRepositories && (
        <Alert>
          <AlertTriangle className='h-4 w-4' />
          <AlertTitle>Repository Limit Reached</AlertTitle>
          <AlertDescription className='flex items-center justify-between'>
            <span>
              You have reached the maximum number of repositories on your tier. To add more repositories, please upgrade
              your plan.
            </span>
            <Button asChild size='sm' className='ml-4'>
              <Link href='/dashboard/settings/billing'>Upgrade Plan</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className='grid gap-4 grid-cols-1 md:grid-cols-3 items-center justify-center'>
        <div className='md:col-span-2'>
          <h1 className='text-3xl font-semibold mb-2'>Project: {project.name}</h1>
          <p className='text-muted-foreground text-sm'>
            <a href={project.url} target='_blank' rel='noopener noreferrer' className='underline underline-offset-4'>
              {project.url}
            </a>
            {project.synchronizedAt && (
              <span className='flex items-center gap-1 mt-1'>
                <Calendar className='size-3' />
                Last synchronized: <TimeAgo date={project.synchronizedAt} />
              </span>
            )}
          </p>
        </div>
        <ButtonGroup className='mt-4 md:w-full lg:mt-0 lg:justify-self-end lg:w-auto'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline' size='icon' aria-label='More Options'>
                <MoreHorizontalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-52'>
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => handleSync(project)} disabled={!isManualSyncAllowed(project)}>
                  {project.synchronizationStatus === 'pending' ? (
                    <>
                      <Spinner />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw />
                      {(() => {
                        const nextSync = getNextManualSyncTime(project);
                        if (nextSync) {
                          return (
                            <div className='flex flex-col'>
                              Project sync recently done. Try again <TimeAgo date={nextSync} />
                            </div>
                          );
                        }
                        return 'Sync Now';
                      })()}
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem variant='destructive' onClick={() => handleDisconnect(project)}>
                  <Unplug />
                  Disconnect
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </ButtonGroup>
      </div>

      <div className='border rounded-lg overflow-hidden'>
        <Table>
          <TableHeader>
            <TableRow className='hover:bg-transparent'>
              <TableHead className='font-semibold'>Repository Name</TableHead>
              <TableHead className='font-semibold w-32 text-right'>Last Updated</TableHead>
              <TableHead className='font-semibold w-24 text-right'>Sync Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {repositories.map((repo) => (
              <TableRow
                key={repo.id}
                className='group hover:cursor-pointer'
                onClick={() => router.push(`/dashboard/repositories/${repo.id}`)}
              >
                <TableCell>{repo.name}</TableCell>
                <TableCell className='text-right'>
                  <TimeAgo date={repo.updatedAt} />
                </TableCell>
                <TableCell className='text-right'>
                  <SynchronizationStatusBadge status={repo.synchronizationStatus} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
