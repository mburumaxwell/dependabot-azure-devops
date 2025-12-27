'use client';

import { AlertCircle, Calendar, Download, GitBranch, MapPinHouse, PlayCircle, Timer } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { EcosystemIcon, type Icon, UpdateJobStatusIcon, UpdateJobTriggerIcon } from '@/components/icons';
import { TimeAgo } from '@/components/time-ago';
import { Button } from '@/components/ui/button';
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from '@/components/ui/item';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Spinner } from '@/components/ui/spinner';
import type { Organization, UpdateJob } from '@/lib/prisma';
import { getRegionInfo, type RegionCode } from '@/lib/regions';
import { formatDuration } from '@/lib/utils';

type SlimOrganization = Pick<Organization, 'id' | 'slug'>;
type SlimUpdateJob = Pick<
  UpdateJob,
  | 'id'
  | 'repositorySlug'
  | 'ecosystem'
  | 'trigger'
  | 'status'
  | 'region'
  | 'createdAt'
  | 'startedAt'
  | 'finishedAt'
  | 'duration'
>;
export function InfoSection({ job }: { job: SlimUpdateJob }) {
  function RegionLabel({ code }: { code: RegionCode }) {
    return <span title={code}>{getRegionInfo(code)?.label ?? code}</span>;
  }

  const parts: {
    label: string;
    value: React.ReactNode | string;
    icon: Icon;
  }[] = [
    { label: 'Repository', value: job.repositorySlug, icon: GitBranch },
    { label: 'Region', value: <RegionLabel code={job.region} />, icon: MapPinHouse },
    { label: 'Ecosystem', value: job.ecosystem, icon: () => <EcosystemIcon ecosystem={job.ecosystem} /> },
    { label: 'Trigger', value: job.trigger, icon: () => <UpdateJobTriggerIcon trigger={job.trigger} /> },
    { label: 'Status', value: job.status, icon: () => <UpdateJobStatusIcon status={job.status} /> },
    { label: 'Duration', value: job.duration ? formatDuration(job.duration) : '-', icon: Timer },
    { label: 'Created', value: <TimeAgo value={job.createdAt} />, icon: Calendar },
    { label: 'Started', value: job.startedAt ? <TimeAgo value={job.startedAt} /> : '-', icon: PlayCircle },
  ];

  return (
    <ItemGroup className='flex-none grid md:grid-cols-2 lg:grid-cols-3'>
      {parts.map(({ label, value, icon: Icon }) => (
        <React.Fragment key={label}>
          <Item className='p-2 gap-2'>
            <ItemMedia variant='icon'>
              <Icon className='size-4' />
            </ItemMedia>
            <ItemContent className='gap-0.5 '>
              <ItemTitle>{label}</ItemTitle>
              <p className='text-muted-foreground text-sm leading-normal font-normal text-balance'>{value}</p>
            </ItemContent>
          </Item>
        </React.Fragment>
      ))}
    </ItemGroup>
  );
}

export function LogsSection({ organization, job }: { organization: SlimOrganization; job: SlimUpdateJob }) {
  const url = `/dashboard/${organization.slug}/runs/${job.id}/logs` as Route;
  const [logs, setLogs] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const fetchLogs = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(url, { signal: controller.signal });
        if (cancelled) return;

        if (response.status === 404) {
          setError('Logs not found');
          setLogs('');
        } else if (!response.ok) {
          throw new Error(`Failed to fetch logs: ${response.statusText}`);
        } else {
          const logText = await response.text();
          if (cancelled) return;
          setLogs(logText);
        }
      } catch (error) {
        if (cancelled) return;
        if (error instanceof Error && error.name === 'AbortError') return;
        console.error('[v0] Error fetching logs:', error);
        setError(error instanceof Error ? error.message : 'Failed to load logs');
        setLogs('');
      }

      if (!cancelled) {
        setLoading(false);
      }
    };

    fetchLogs();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [url]);

  return (
    <Item variant='outline'>
      <ItemContent>
        <ItemTitle>Logs</ItemTitle>
        <ItemDescription>Logs collected from the update job</ItemDescription>
      </ItemContent>
      <ItemActions>
        <Button variant='secondary' asChild disabled={loading || !!error || logs.length === 0}>
          <Link href={url} className='flex' target='_blank' rel='noopener noreferrer'>
            <Download className='mr-2 size-4' />
            Download Logs
          </Link>
        </Button>
      </ItemActions>
      {loading && (
        <div className='flex items-center justify-center h-125 w-full rounded-md border bg-muted/50'>
          <div className='flex flex-col items-center gap-3'>
            <Spinner className='size-8 text-muted-foreground' />
            <p className='text-sm text-muted-foreground'>Loading logs...</p>
          </div>
        </div>
      )}
      {error && (
        <div className='flex items-center justify-center h-125 w-full rounded-md border bg-muted/50'>
          <div className='flex flex-col items-center gap-3'>
            <AlertCircle className='size-8 text-muted-foreground' />
            <p className='text-sm text-muted-foreground'>{error}</p>
          </div>
        </div>
      )}
      {!loading && !error && (
        <ScrollArea className='h-125 w-full border bg-muted/50 p-4'>
          <pre className='text-xs font-mono leading-relaxed whitespace-pre-wrap'>{logs}</pre>
        </ScrollArea>
      )}
    </Item>
  );
}
