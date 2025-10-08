import { ArrowDown, ArrowUp } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: string;
  trendUp?: boolean;
}

export function MetricCard({ title, value, subtitle, trend, trendUp }: MetricCardProps) {
  return (
    <Card className='p-4'>
      <div className='flex flex-col gap-2'>
        <p className='text-sm text-muted-foreground'>{title}</p>
        <div className='flex items-baseline gap-2'>
          <p className='text-3xl font-semibold text-foreground'>{value}</p>
          {trend && (
            <span className={`text-xs flex items-center gap-1 ${trendUp ? 'text-success' : 'text-destructive'}`}>
              {trendUp ? <ArrowUp className='w-3 h-3' /> : <ArrowDown className='w-3 h-3' />}
              {trend}
            </span>
          )}
        </div>
        {subtitle && <p className='text-xs text-muted-foreground'>{subtitle}</p>}
      </div>
    </Card>
  );
}
