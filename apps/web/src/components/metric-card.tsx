import { ArrowDown, ArrowUp } from 'lucide-react';
import type { Icon } from '@/components/icons';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: string;
  direction?: 'neutral' | 'up' | 'down';
  unit?: string | React.ReactNode;
  icon?: Icon;
  footer?: string | React.ReactNode;
}

export function getMetricDirection(value: number) {
  if (value === 0) return 'neutral';
  return value > 0 ? 'up' : 'down';
}

export function MetricCard({ title, value, subtitle, trend, direction, unit, icon: Icon, footer }: MetricCardProps) {
  return (
    <Card className='gap-4 py-4'>
      <CardHeader className='flex flex-row items-center justify-between'>
        <CardTitle className='font-normal text-muted-foreground text-sm'>{title}</CardTitle>
        {Icon && <Icon className='size-4 text-muted-foreground' />}
      </CardHeader>
      <CardContent className='gap-1'>
        <div className='flex items-baseline gap-2'>
          <p className='font-semibold text-2xl text-foreground'>{value}</p>
          {trend && direction && (
            <span
              className={cn(
                'flex items-center gap-1 text-xs',
                (direction === 'up' && 'text-success') || 'text-destructive',
              )}
            >
              {(direction === 'up' && <ArrowUp className='size-3' />) || <ArrowDown className='size-3' />}
              {trend}
              {unit}
            </span>
          )}
        </div>
        {subtitle && <p className='text-muted-foreground text-xs'>{subtitle}</p>}
      </CardContent>
      {footer && <CardFooter> {footer} </CardFooter>}
    </Card>
  );
}
