import { ArrowUpRightIcon, Folder } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';

export function BillingNotConfiguredView({ slug }: { slug: string }) {
  return (
    <div className='mx-auto flex min-h-screen w-full max-w-5xl space-y-6 p-6'>
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
            <Link href={`/dashboard/${slug}/settings/billing`}>
              <Button>Configure Billing</Button>
            </Link>
          </div>
        </EmptyContent>
        <a href='/#pricing' target='_blank' rel='noreferrer'>
          <Button variant='link' className='text-muted-foreground' size='sm'>
            Learn More <ArrowUpRightIcon />
          </Button>
        </a>
      </Empty>
    </div>
  );
}
