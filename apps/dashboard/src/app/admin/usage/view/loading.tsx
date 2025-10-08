import { DashboardSkeleton } from './part-skeleton';

export default function Loading() {
  return (
    <div className='min-h-screen bg-background'>
      <DashboardSkeleton />
    </div>
  );
}
