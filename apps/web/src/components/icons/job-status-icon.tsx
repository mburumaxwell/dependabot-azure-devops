import { CircleCheckBig, CircleX } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import type { UpdateJobStatus } from '@/lib/prisma';
import { cn } from '@/lib/utils';

export function JobStatusIcon({
  status,
  className,
  ...props
}: { status: UpdateJobStatus } & React.ComponentPropsWithoutRef<'svg'>) {
  switch (status) {
    case 'succeeded':
      return <CircleCheckBig className={cn('text-green-500', className)} {...props} />;
    case 'scheduled':
    case 'running':
      return <Spinner className={cn('text-orange-300', className)} {...props} />;
    case 'failed':
      return <CircleX className={cn('text-red-500', className)} {...props} />;
    default:
      return null;
  }
}
