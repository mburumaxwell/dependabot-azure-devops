import { Calendar, CheckCircle2, CircleCheckBig, CircleX, Command, RefreshCw, Timer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import type { UpdateJobStatus, UpdateJobTrigger } from '@/lib/prisma';
import { cn } from '@/lib/utils';

export function UpdateJobStatusIcon({
  status,
  className,
  ...props
}: { status: UpdateJobStatus } & React.ComponentPropsWithoutRef<'svg'>) {
  switch (status) {
    case 'succeeded':
      return <CircleCheckBig className={cn('text-green-500', className)} {...props} />;
    case 'scheduled':
      return <Timer className={cn('text-blue-500', className)} {...props} />;
    case 'running':
      return <Spinner className={cn('text-orange-300', className)} {...props} />;
    case 'failed':
      return <CircleX className={cn('text-red-500', className)} {...props} />;
    default:
      return null;
  }
}

export function UpdateJobStatusBadge({
  status,
  className,
  ...props
}: { status: UpdateJobStatus } & React.ComponentProps<typeof Badge>) {
  const variants = {
    scheduled: { variant: 'secondary' as const, label: 'Scheduled', icon: Timer, className: undefined },
    succeeded: {
      variant: 'default' as const,
      label: 'Succeeded',
      icon: CheckCircle2,
      className: 'bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-500/20',
    },
    running: { variant: 'default' as const, label: 'Running', icon: Spinner, className: undefined },
    failed: { variant: 'destructive' as const, label: 'Failed', icon: CircleX, className: undefined },
  };

  const { variant, label, icon: Icon, className: baseClassName = '' } = variants[status];

  return (
    <Badge variant={variant} className={cn(baseClassName, className)} {...props}>
      <Icon className='mr-1' />
      {label}
    </Badge>
  );
}

export function UpdateJobTriggerIcon({
  trigger,
  className,
  ...props
}: { trigger: UpdateJobTrigger } & React.ComponentPropsWithoutRef<'svg'>) {
  switch (trigger) {
    case 'scheduled':
      return <Calendar className={cn('text-muted-foreground', className)} {...props} />;
    case 'synchronization':
      return <RefreshCw className={cn('text-blue-500', className)} {...props} />;
    case 'manual':
      return <Command className={cn('text-purple-500', className)} {...props} />;
    default:
      return null;
  }
}
