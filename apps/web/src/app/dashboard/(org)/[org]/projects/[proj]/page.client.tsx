'use client';

import { Calendar, MoreHorizontalIcon, RefreshCw, Unplug } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { disconnectProject } from '@/actions/projects';
import { requestSync } from '@/actions/sync';
import { SynchronizationStatusBadge } from '@/components/icons';
import { TimeAgo } from '@/components/time-ago';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getNextManualSyncTime, isManualSyncAllowed } from '@/lib/organizations';
import type { Project, Repository } from '@/lib/prisma';

type SimpleOrganization = Pick<Repository, 'id' | 'slug'>;
type SimpleProject = Pick<
  Project,
  'id' | 'name' | 'url' | 'synchronizationStatus' | 'synchronizedAt' | 'organizationId'
>;
type SimpleRepository = Pick<Repository, 'id' | 'name' | 'updatedAt' | 'synchronizationStatus' | 'synchronizedAt'>;
export function RepositoriesView({
  organization,
  project: initialProject,
  repositories,
}: {
  organization: SimpleOrganization;
  project: SimpleProject;
  repositories: SimpleRepository[];
}) {
  const router = useRouter();
  const [project, setProject] = useState(initialProject);
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [isRequestingSync, setIsRequestingSync] = useState(false);
  const [triggerUpdateJobs, setTriggerUpdateJobs] = useState(false);

  async function handleSync(project: SimpleProject) {
    setIsRequestingSync(true);
    try {
      const updatedProject = await requestSync({
        organizationId: project.organizationId,
        projectId: project.id,
        scope: 'project',
        trigger: triggerUpdateJobs,
      });
      setProject(updatedProject);
      setShowSyncDialog(false);
    } finally {
      setIsRequestingSync(false);
    }
  }

  async function handleDisconnect(project: SimpleProject) {
    try {
      await disconnectProject({ organizationId: project.organizationId, projectId: project.id });

      toast.success('Disconnected', {
        description: `Successfully disconnected project "${project.name}"`,
      });
      router.push(`/dashboard/${organization.slug}/projects`);
    } catch (error) {
      toast.error('Failed to disconnect project', {
        description: (error as Error).message,
      });
    }
  }

  return (
    <div className='p-6 w-full max-w-5xl mx-auto space-y-6'>
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
                Last synchronized: <TimeAgo value={project.synchronizedAt} />
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
                <DropdownMenuItem onClick={() => setShowSyncDialog(true)} disabled={!isManualSyncAllowed(project)}>
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
                              Project sync recently done. Try again <TimeAgo value={nextSync} />
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
          <Dialog open={showSyncDialog} onOpenChange={setShowSyncDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Sync Project</DialogTitle>
                <DialogDescription>
                  This will start a synchronization process for all repositories in this project.
                </DialogDescription>
              </DialogHeader>
              <FieldGroup className='py-3'>
                <Field orientation='horizontal'>
                  <Checkbox
                    id='trigger'
                    checked={triggerUpdateJobs}
                    onCheckedChange={(v) => v !== 'indeterminate' && setTriggerUpdateJobs(v)}
                  />
                  <FieldContent>
                    <FieldLabel htmlFor='trigger'>Trigger update jobs after synchronization</FieldLabel>
                    <FieldDescription>
                      If checked, new update jobs will be run for each repository update configuration after
                      synchronization.
                    </FieldDescription>
                  </FieldContent>
                </Field>
              </FieldGroup>
              <DialogFooter>
                <DialogClose asChild disabled={isRequestingSync}>
                  <Button variant='outline'>Cancel</Button>
                </DialogClose>
                <Button onClick={() => handleSync(project)} disabled={isRequestingSync}>
                  {isRequestingSync ? (
                    <>
                      <Spinner className='mr-2' />
                      Requesting...{' '}
                    </>
                  ) : (
                    'Confirm'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
                onClick={() => router.push(`/dashboard/${organization.slug}/projects/${project.id}/repos/${repo.id}`)}
              >
                <TableCell>{repo.name}</TableCell>
                <TableCell className='text-right'>
                  <TimeAgo value={repo.updatedAt} />
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
