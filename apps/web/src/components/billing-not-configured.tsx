import { ArrowUpRightIcon, Folder } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';

export function BillingNotConfiguredView() {
  return (
    <div className='p-6 w-full max-w-5xl mx-auto space-y-6 min-h-screen flex'>
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant='icon'>
            <Folder />
          </EmptyMedia>
          <EmptyTitle>Billing is not setup yet</EmptyTitle>
          <EmptyDescription>Please configure billing for your organization to manage projects.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <div className='flex gap-2'>
            <Button asChild>
              <Link href='/dashboard/settings/billing'>Configure Billing</Link>
            </Button>
          </div>
        </EmptyContent>
        <Button variant='link' asChild className='text-muted-foreground' size='sm'>
          <a href='/#pricing' target='_blank' rel='noreferrer'>
            Learn More <ArrowUpRightIcon />
          </a>
        </Button>
      </Empty>
    </div>
  );
}
