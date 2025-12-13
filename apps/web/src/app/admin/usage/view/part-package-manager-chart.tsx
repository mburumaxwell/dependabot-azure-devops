'use client';

import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '@/components/ui/card';
import type { UsageTelemetry } from '@/lib/mongodb';

interface PackageManagerChartProps {
  telemetries: Pick<UsageTelemetry, 'packageManager' | 'success'>[];
}

export function PackageManagerChart({ telemetries }: PackageManagerChartProps) {
  const chartData = useMemo(() => {
    const grouped = telemetries.reduce(
      (acc, item) => {
        if (!acc[item.packageManager]) {
          acc[item.packageManager] = { name: item.packageManager, success: 0, failure: 0 };
        }
        if (item.success) {
          acc[item.packageManager]!.success++;
        } else {
          acc[item.packageManager]!.failure++;
        }
        return acc;
      },
      {} as Record<string, { name: string; success: number; failure: number }>,
    );

    return Object.values(grouped).sort((a, b) => b.success + b.failure - (a.success + a.failure));
  }, [telemetries]);

  return (
    <Card className='p-6'>
      <div className='flex flex-col gap-4'>
        <div>
          <h3 className='text-lg font-semibold text-foreground'>Package Manager Usage</h3>
          <p className='text-sm text-muted-foreground'>Distribution by package manager</p>
        </div>
        <div className='h-[300px]'>
          <ResponsiveContainer width='100%' height='100%'>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray='3 3' stroke='hsl(var(--border))' />
              <XAxis dataKey='name' stroke='hsl(var(--muted-foreground))' fontSize={12} />
              <YAxis stroke='hsl(var(--muted-foreground))' fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))',
                }}
              />
              <Legend />
              <Bar dataKey='success' fill='hsl(var(--chart-4))' name='Success' radius={[4, 4, 0, 0]} />
              <Bar dataKey='failure' fill='hsl(var(--chart-3))' name='Failure' radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
}
