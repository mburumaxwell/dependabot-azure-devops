'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface UsageTelemetry {
  id: bigint;
  version: string;
  provider: string;
  owner: string;
  packageManager: string;
  started: Date;
  duration: number;
  success: boolean;
}

interface TelemetryTableProps {
  data: UsageTelemetry[];
}

const ITEMS_PER_PAGE = 10;

export function TelemetryTable({ data }: TelemetryTableProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => b.started.getTime() - a.started.getTime());
  }, [data]);

  const totalPages = Math.ceil(sortedData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedData = sortedData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const shortenOwner = (owner: string) => {
    return owner.replace('https://', '').replace('http://', '');
  };

  return (
    <Card className='p-6'>
      <div className='flex flex-col gap-4'>
        <div className='flex items-center justify-between'>
          <div>
            <h3 className='text-lg font-semibold text-foreground'>Recent Runs</h3>
            <p className='text-sm text-muted-foreground'>
              Showing {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, sortedData.length)} of {sortedData.length}{' '}
              runs
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className='w-4 h-4' />
            </Button>
            <span className='text-sm text-muted-foreground'>
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className='w-4 h-4' />
            </Button>
          </div>
        </div>

        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead>
              <tr className='border-b border-border'>
                <th className='text-left py-3 px-4 text-sm font-medium text-muted-foreground'>Status</th>
                <th className='text-left py-3 px-4 text-sm font-medium text-muted-foreground'>Owner</th>
                <th className='text-left py-3 px-4 text-sm font-medium text-muted-foreground'>Package Manager</th>
                <th className='text-left py-3 px-4 text-sm font-medium text-muted-foreground'>Version</th>
                <th className='text-left py-3 px-4 text-sm font-medium text-muted-foreground'>Duration</th>
                <th className='text-left py-3 px-4 text-sm font-medium text-muted-foreground'>Started</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((item) => (
                <tr key={item.id.toString()} className='border-b border-border hover:bg-muted/50 transition-colors'>
                  <td className='py-3 px-4'>
                    <Badge
                      variant={item.success ? 'default' : 'destructive'}
                      className={item.success ? 'bg-success text-success-foreground' : ''}
                    >
                      {item.success ? 'Success' : 'Failed'}
                    </Badge>
                  </td>
                  <td className='py-3 px-4 text-sm text-foreground font-mono'>{shortenOwner(item.owner)}</td>
                  <td className='py-3 px-4 text-sm text-foreground'>
                    <Badge variant='outline'>{item.packageManager}</Badge>
                  </td>
                  <td className='py-3 px-4 text-sm text-muted-foreground font-mono'>{item.version}</td>
                  <td className='py-3 px-4 text-sm text-muted-foreground'>{formatDuration(item.duration)}</td>
                  <td className='py-3 px-4 text-sm text-muted-foreground'>{formatDate(item.started)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}
