import { Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import type { SynchronizationStatus } from '@/lib/prisma';

export function SynchronizationStatusBadge({
  status,
  ...props
}: { status: SynchronizationStatus } & React.ComponentProps<typeof Badge>) {
  const variants = {
    success: { variant: 'default' as const, text: 'Synced', icon: Activity },
    failed: { variant: 'destructive' as const, text: 'Failed', icon: Activity },
    pending: { variant: 'secondary' as const, text: 'Syncing...', icon: Spinner },
  };

  const { variant, text, icon: Icon } = variants[status];

  return (
    <Badge variant={variant} {...props}>
      <Icon />
      {text}
    </Badge>
  );
}
