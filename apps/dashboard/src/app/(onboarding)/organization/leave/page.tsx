import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Leave Organization',
  description: 'Leave your organization and stop managing projects',
  openGraph: { url: `/organization/leave` },
};

export default function OrgLeavePage() {
  return (
    <div className='flex flex-1 flex-col gap-4 p-4'>
      <div className='grid auto-rows-min gap-4 md:grid-cols-3'>
        <div className='bg-muted/50 aspect-video rounded-xl' />
        <div className='bg-muted/50 aspect-video rounded-xl' />
        <div className='bg-muted/50 aspect-video rounded-xl' />
      </div>
      <div className='bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min' />
    </div>
  );
}
