'use client';

import { Calendar } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type TimeRange, timeRangeOptions } from '@/lib/aggregation';
import type { UsageTelemetry } from '@/lib/prisma/client';
import { MetricCard } from './part-metric-card';
import { PackageManagerChart } from './part-package-manager-chart';
import { RunsChart } from './part-runs-chart';
import { TelemetryTable } from './part-telemetry-table';

interface TelemetryDashboardProps {
  initialData: UsageTelemetry[];
}

export function TelemetryDashboard({ initialData }: TelemetryDashboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [ownerSearch, setOwnerSearch] = useState('');
  const [showOwnerSuggestions, setShowOwnerSuggestions] = useState(false);

  const timeRange = (searchParams.get('timeRange') as TimeRange) ?? '24h';
  const selectedOwner = searchParams.get('owner') ?? '';
  const selectedPackageManager = searchParams.get('packageManager') ?? 'all';
  const successFilter = searchParams.get('success') ?? 'all';

  const updateFilters = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== 'all') {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    router.push(`?${params.toString()}`);
  };

  // Extract unique values for filters
  const owners = useMemo(() => {
    const unique = Array.from(new Set(initialData.map((d) => d.owner)));
    return unique.sort();
  }, [initialData]);

  const filteredOwners = useMemo(() => {
    if (!ownerSearch) return owners;
    const search = ownerSearch.toLowerCase();
    return owners.filter((owner) => owner.toLowerCase().includes(search)).slice(0, 10);
  }, [owners, ownerSearch]);

  const packageManagers = useMemo(() => {
    const unique = Array.from(new Set(initialData.map((d) => d.packageManager)));
    return unique.sort();
  }, [initialData]);

  const metrics = useMemo(() => {
    const totalRuns = initialData.length;
    const successfulRuns = initialData.filter((d) => d.success).length;
    const failedRuns = totalRuns - successfulRuns;
    const successRate = totalRuns > 0 ? (successfulRuns / totalRuns) * 100 : 0;

    // Calculate median duration
    let medianDuration = 0;
    if (totalRuns > 0) {
      const sortedDurations = [...initialData].map((d) => d.duration).sort((a, b) => a - b);
      const mid = Math.floor(sortedDurations.length / 2);
      medianDuration =
        sortedDurations.length % 2 === 0
          ? (sortedDurations[mid - 1]! + sortedDurations[mid]!) / 2
          : sortedDurations[mid]!;
    }

    const totalDuration = initialData.reduce((sum, d) => sum + d.duration, 0);

    // Format total duration to human-readable format
    const formatDuration = (ms: number) => {
      const seconds = ms / 1000;
      const minutes = seconds / 60;
      const hours = minutes / 60;
      const days = hours / 24;

      if (days >= 1) {
        return `${days.toFixed(1)} days`;
      } else if (hours >= 1) {
        return `${hours.toFixed(1)} hrs`;
      } else if (minutes >= 1) {
        return `${minutes.toFixed(1)} min`;
      } else {
        return `${seconds.toFixed(1)} sec`;
      }
    };

    return {
      totalRuns,
      successfulRuns,
      failedRuns,
      successRate,
      medianDuration,
      totalDuration,
      formattedTotalDuration: formatDuration(totalDuration),
    };
  }, [initialData]);

  return (
    <div className='flex flex-col gap-6 p-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-semibold text-foreground'>Usage Telemetry</h1>
          <p className='text-sm text-muted-foreground mt-1'>Monitor and analyze pipeline execution metrics</p>
        </div>
      </div>

      {/* Filters */}
      <Card className='p-4'>
        <div className='flex flex-wrap gap-3'>
          <Select value={timeRange} onValueChange={(value) => updateFilters({ timeRange: value })}>
            <SelectTrigger className='w-[180px]'>
              <Calendar className='w-4 h-4 mr-2' />
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

          <div className='relative w-[280px]'>
            <Input
              placeholder='Filter by owner (type to search)...'
              value={ownerSearch || selectedOwner.replace('https://', '').replace('http://', '')}
              onChange={(e) => {
                setOwnerSearch(e.target.value);
                setShowOwnerSuggestions(true);
              }}
              onFocus={() => setShowOwnerSuggestions(true)}
              onBlur={() => setTimeout(() => setShowOwnerSuggestions(false), 200)}
              className='w-full'
            />
            {showOwnerSuggestions && filteredOwners.length > 0 && ownerSearch && (
              <Card className='absolute top-full mt-1 w-full max-h-[300px] overflow-y-auto z-50 p-1'>
                {filteredOwners.map((owner) => (
                  <button
                    key={owner}
                    className='w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-sm transition-colors'
                    type='button'
                    onClick={() => {
                      updateFilters({ owner });
                      setOwnerSearch(owner.replace('https://', '').replace('http://', ''));
                      setShowOwnerSuggestions(false);
                    }}
                  >
                    {owner.replace('https://', '').replace('http://', '')}
                  </button>
                ))}
              </Card>
            )}
            {selectedOwner && (
              <Button
                variant='ghost'
                size='sm'
                className='absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2'
                onClick={() => {
                  updateFilters({ owner: '' });
                  setOwnerSearch('');
                }}
              >
                Clear
              </Button>
            )}
          </div>

          <Select value={selectedPackageManager} onValueChange={(value) => updateFilters({ packageManager: value })}>
            <SelectTrigger className='w-[200px]'>
              <SelectValue placeholder='All Package Managers' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Package Managers</SelectItem>
              {packageManagers.map((pm) => (
                <SelectItem key={pm} value={pm}>
                  {pm}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={successFilter} onValueChange={(value) => updateFilters({ success: value })}>
            <SelectTrigger className='w-[140px]'>
              <SelectValue placeholder='All Status' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Status</SelectItem>
              <SelectItem value='success'>Success Only</SelectItem>
              <SelectItem value='failure'>Failure Only</SelectItem>
            </SelectContent>
          </Select>

          {(selectedOwner || selectedPackageManager !== 'all' || successFilter !== 'all') && (
            <Button
              variant='ghost'
              size='sm'
              onClick={() => {
                router.push('/');
                setOwnerSearch('');
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      </Card>

      {/* Key Metrics */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4'>
        <MetricCard
          title='Total Runs'
          value={metrics.totalRuns.toLocaleString()}
          trend={metrics.totalRuns > 0 ? '+12%' : undefined}
          trendUp={true}
        />
        <MetricCard
          title='Success Rate'
          value={`${metrics.successRate.toFixed(1)}%`}
          trend={metrics.successRate > 90 ? 'Excellent' : metrics.successRate > 75 ? 'Good' : 'Needs attention'}
          trendUp={metrics.successRate > 90}
        />
        <MetricCard
          title='Total Duration'
          value={metrics.formattedTotalDuration}
          subtitle={`${(metrics.totalDuration / 1000).toLocaleString()} seconds`}
        />
        <MetricCard
          title='Median Duration'
          value={`${(metrics.medianDuration / 1000).toFixed(2)}s`}
          subtitle={`${metrics.medianDuration.toLocaleString()}ms`}
        />
        <MetricCard
          title='Failed Runs'
          value={metrics.failedRuns.toLocaleString()}
          trend={metrics.failedRuns > 0 ? `${((metrics.failedRuns / metrics.totalRuns) * 100).toFixed(1)}%` : '0%'}
          trendUp={false}
        />
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
        <RunsChart data={initialData} timeRange={timeRange} />
        <PackageManagerChart data={initialData} />
      </div>

      {/* Data Table */}
      <TelemetryTable data={initialData} />
    </div>
  );
}
