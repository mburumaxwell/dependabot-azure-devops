'use client';

import type { DependabotPackageManager } from '@paklo/core/dependabot';
import { Calendar, Funnel, FunnelX } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { EcosystemIcon, UpdateJobStatusBadge, UpdateJobTriggerIcon } from '@/components/icons';
import { TimeAgo } from '@/components/time-ago';
import { Button } from '@/components/ui/button';
import { Item, ItemActions, ItemContent, ItemMedia } from '@/components/ui/item';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { type TimeRange, timeRangeOptions } from '@/lib/aggregation';
import { packageManagerOptions, updateJobStatusOptions, updateJobTriggerOptions, type WithAll } from '@/lib/enums';
import type { Project, UpdateJob, UpdateJobStatus, UpdateJobTrigger } from '@/lib/prisma';
import { formatDuration } from '@/lib/utils';

type SlimProject = Pick<Project, 'id' | 'name'>;
type SlimUpdateJob = Pick<
  UpdateJob,
  | 'id'
  | 'createdAt'
  | 'projectId'
  | 'packageManager'
  | 'ecosystem'
  | 'trigger'
  | 'status'
  | 'repositorySlug'
  | 'duration'
>;
export default function RunsView({ projects, jobs }: { projects: SlimProject[]; jobs: SlimUpdateJob[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const timeRange = (searchParams.get('timeRange') as TimeRange) ?? '24h';
  const projectFilter = (searchParams.get('project') as WithAll<string>) ?? 'all';
  const statusFilter = (searchParams.get('status') as WithAll<UpdateJobStatus>) ?? 'all';
  const triggerFilter = (searchParams.get('trigger') as WithAll<UpdateJobTrigger>) ?? 'all';
  const selectedPackageManager = (searchParams.get('packageManager') as WithAll<DependabotPackageManager>) ?? 'all';

  function updateFilters(updates: Record<string, string>, clear: boolean = false) {
    const params = new URLSearchParams(clear ? '' : searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== 'all') {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    router.push(`?${params.toString()}`);
  }

  return (
    <>
      {/* Filters */}
      <Item variant='outline'>
        <ItemMedia variant='icon'>
          <Funnel />
        </ItemMedia>
        <ItemContent>
          <div className='flex flex-wrap gap-3'>
            <Select value={timeRange} onValueChange={(value) => updateFilters({ timeRange: value })}>
              <SelectTrigger className='w-[180px]'>
                <Calendar className='size-4 mr-2' />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeRangeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={projectFilter} onValueChange={(value) => updateFilters({ project: value })}>
              <SelectTrigger className='w-[140px]'>
                <SelectValue placeholder='All Projects' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Projects</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(value) => updateFilters({ status: value })}>
              <SelectTrigger className='w-[140px]'>
                <SelectValue placeholder='All Statuses' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Statuses</SelectItem>
                {updateJobStatusOptions.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={triggerFilter} onValueChange={(value) => updateFilters({ trigger: value })}>
              <SelectTrigger className='w-[140px]'>
                <SelectValue placeholder='All Triggers' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Triggers</SelectItem>
                {updateJobTriggerOptions.map((trigger) => (
                  <SelectItem key={trigger.value} value={trigger.value}>
                    {trigger.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedPackageManager} onValueChange={(value) => updateFilters({ packageManager: value })}>
              <SelectTrigger className='w-[200px]'>
                <SelectValue placeholder='All Package Managers' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Package Managers</SelectItem>
                {packageManagerOptions.map((pm) => (
                  <SelectItem key={pm.value} value={pm.value}>
                    {pm.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </ItemContent>
        <ItemActions>
          <Button
            variant='ghost'
            size='icon-sm'
            onClick={() => updateFilters({}, true)}
            disabled={
              !(
                projectFilter !== 'all' ||
                statusFilter !== 'all' ||
                triggerFilter !== 'all' ||
                selectedPackageManager !== 'all'
              )
            }
          >
            <FunnelX />
          </Button>
        </ItemActions>
      </Item>

      {/* Data Table */}
      <div className='rounded-md border'>
        <Table className='text-sm'>
          <TableHeader>
            <TableRow>
              <TableHead>Repository</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Started</TableHead>
              <TableHead>Duration</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className='text-center py-12'>
                  <div className='space-y-2'>
                    <Funnel className='size-8 text-muted-foreground mx-auto' />
                    <p className='text-muted-foreground'>No jobs found matching your filters</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              jobs.map((job) => (
                <TableRow
                  key={job.id}
                  className='cursor-pointer hover:bg-accent/50'
                  onClick={() => router.push(`/dashboard/runs/${job.id}`)}
                >
                  <TableCell className='text-medium'>
                    <div className='flex items-center gap-2'>
                      <EcosystemIcon ecosystem={job.ecosystem} className='size-5' />
                      <span className='text-wrap wrap-break-word'>{job.repositorySlug}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <UpdateJobStatusBadge status={job.status} />
                  </TableCell>
                  <TableCell>
                    <div className='flex items-center gap-2'>
                      <UpdateJobTriggerIcon trigger={job.trigger} className='size-4' />
                      {(job.createdAt && <TimeAgo value={job.createdAt} />) || '—'}
                    </div>
                  </TableCell>
                  <TableCell>{(job.duration && formatDuration(job.duration)) || '—'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
