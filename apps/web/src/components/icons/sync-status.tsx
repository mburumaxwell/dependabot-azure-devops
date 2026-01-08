import { Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import type { SynchronizationStatus } from '@/lib/enums';

export function SynchronizationStatusBadge({
  status,
  ...props
}: { status: SynchronizationStatus } & React.ComponentProps<typeof Badge>) {
  const variants = {
    success: { variant: 'default' as const, label: 'Synced', icon: Activity },
    failed: { variant: 'destructive' as const, label: 'Failed', icon: Activity },
    pending: { variant: 'secondary' as const, label: 'Syncing...', icon: Spinner },
  };

  const { variant, label, icon: Icon } = variants[status];

  return (
    <Badge variant={variant} {...props}>
      <Icon />
      {label}
    </Badge>
  );
}
