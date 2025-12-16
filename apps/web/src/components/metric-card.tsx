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
    <Card className='py-4 gap-4'>
      <CardHeader className='flex flex-row items-center justify-between'>
        <CardTitle className='text-sm text-muted-foreground font-normal'>{title}</CardTitle>
        {Icon && <Icon className='size-4 text-muted-foreground' />}
      </CardHeader>
      <CardContent className='gap-1'>
        <div className='flex items-baseline gap-2'>
          <p className='text-2xl font-semibold text-foreground'>{value}</p>
          {trend && direction && (
            <span
              className={cn(
                'text-xs flex items-center gap-1',
                (direction === 'up' && 'text-success') || 'text-destructive',
              )}
            >
              {(direction === 'up' && <ArrowUp className='size-3' />) || <ArrowDown className='size-3' />}
              {trend}
              {unit}
            </span>
          )}
        </div>
        {subtitle && <p className='text-xs text-muted-foreground'>{subtitle}</p>}
      </CardContent>
      {footer && <CardFooter> {footer} </CardFooter>}
    </Card>
  );
}
