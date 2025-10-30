import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function DashboardSkeleton() {
  return (
    <div className='min-h-screen bg-background'>
      <div className='flex flex-col gap-6 p-6'>
        {/* Header Skeleton */}
        <div className='flex items-center justify-between'>
          <div className='space-y-2'>
            <Skeleton className='h-9 w-[280px]' />
            <Skeleton className='h-4 w-[380px]' />
          </div>
        </div>

        {/* Filters Skeleton */}
        <Card className='p-4'>
          <div className='flex flex-wrap gap-3'>
            <Skeleton className='h-10 w-[180px]' />
            <Skeleton className='h-10 w-[280px]' />
            <Skeleton className='h-10 w-[200px]' />
            <Skeleton className='h-10 w-[140px]' />
          </div>
        </Card>

        {/* Metrics Skeleton */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4'>
          {[...Array(5)]
            .map((_, i) => i)
            .map((v) => (
              <Card key={v} className='p-6'>
                <div className='space-y-3'>
                  <Skeleton className='h-4 w-24' />
                  <Skeleton className='h-8 w-20' />
                  <Skeleton className='h-3 w-16' />
                </div>
              </Card>
            ))}
        </div>

        {/* Charts Skeleton */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
          <Card className='p-6'>
            <div className='space-y-4'>
              <div className='space-y-2'>
                <Skeleton className='h-6 w-32' />
                <Skeleton className='h-4 w-48' />
              </div>
              <Skeleton className='h-[300px] w-full' />
            </div>
          </Card>
          <Card className='p-6'>
            <div className='space-y-4'>
              <div className='space-y-2'>
                <Skeleton className='h-6 w-40' />
                <Skeleton className='h-4 w-56' />
              </div>
              <Skeleton className='h-[300px] w-full' />
            </div>
          </Card>
        </div>

        {/* Table Skeleton */}
        <Card className='p-6'>
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <div className='space-y-2'>
                <Skeleton className='h-6 w-32' />
                <Skeleton className='h-4 w-48' />
              </div>
            </div>
            <div className='space-y-3'>
              {[...Array(10)]
                .map((_, i) => i)
                .map((v) => (
                  <Skeleton key={v} className='h-12 w-full' />
                ))}
            </div>
            <div className='flex items-center justify-between'>
              <Skeleton className='h-4 w-32' />
              <div className='flex gap-2'>
                <Skeleton className='h-9 w-24' />
                <Skeleton className='h-9 w-24' />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
