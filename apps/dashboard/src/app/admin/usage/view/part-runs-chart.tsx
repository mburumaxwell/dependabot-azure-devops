'use client';

import { useMemo } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '@/components/ui/card';
import { isHourlyRange, type TimeRange } from '@/lib/aggregation';

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

interface RunsChartProps {
  data: UsageTelemetry[];
  timeRange: TimeRange;
}

export function RunsChart({ data, timeRange }: RunsChartProps) {
  const chartData = useMemo(() => {
    const grouped = data.reduce(
      (acc, item) => {
        let key: string;
        if (isHourlyRange(timeRange)) {
          // Group by hour for short time ranges
          const date = new Date(item.started);
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`;
        } else {
          // Group by day for longer time ranges
          key = item.started.toISOString().split('T')[0]!;
        }

        if (!acc[key]) {
          acc[key] = { date: key, total: 0, success: 0, failure: 0 };
        }
        acc[key]!.total++;
        if (item.success) {
          acc[key]!.success++;
        } else {
          acc[key]!.failure++;
        }
        return acc;
      },
      {} as Record<string, { date: string; total: number; success: number; failure: number }>,
    );

    return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
  }, [data, timeRange]);

  const xAxisFormatter = (value: string) => {
    if (isHourlyRange(timeRange)) {
      // Show time for hourly ranges
      const parts = value.split(' ');
      return parts[1] || value; // Return just the time part (HH:00)
    } else {
      // Show date for daily ranges
      return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const tooltipLabelFormatter = (value: string) => {
    if (isHourlyRange(timeRange)) {
      return new Date(value).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } else {
      return new Date(value).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }
  };

  return (
    <Card className='p-6'>
      <div className='flex flex-col gap-4'>
        <div>
          <h3 className='text-lg font-semibold text-foreground'>Pipeline Runs</h3>
          <p className='text-sm text-muted-foreground'>Total executions over time</p>
        </div>
        <div className='h-[300px]'>
          <ResponsiveContainer width='100%' height='100%'>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray='3 3' stroke='hsl(var(--border))' />
              <XAxis
                dataKey='date'
                stroke='hsl(var(--muted-foreground))'
                fontSize={12}
                tickFormatter={xAxisFormatter}
              />
              <YAxis stroke='hsl(var(--muted-foreground))' fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))',
                }}
                labelFormatter={tooltipLabelFormatter}
              />
              <Line
                type='monotone'
                dataKey='total'
                stroke='hsl(var(--chart-1))'
                strokeWidth={2}
                dot={false}
                name='Total Runs'
              />
              <Line
                type='monotone'
                dataKey='success'
                stroke='hsl(var(--chart-4))'
                strokeWidth={2}
                dot={false}
                name='Successful'
              />
              <Line
                type='monotone'
                dataKey='failure'
                stroke='hsl(var(--chart-3))'
                strokeWidth={2}
                dot={false}
                name='Failed'
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
}
