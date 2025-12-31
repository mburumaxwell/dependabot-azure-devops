import { ArrowRight, CircleCheck, CircleCheckBig, CircleX } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Item, ItemContent, ItemMedia, ItemTitle } from '@/components/ui/item';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PRICE_AMOUNT_MONTHLY_MANAGEMENT } from '@/lib/billing';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import { AZDO_ADS_PRICE_AMOUNT_MONTHLY, comparison } from './page.data';

export const metadata = {
  title: 'Compare',
  description: 'Compare hosted Paklo vs other options',
};

export default function ComparePage() {
  function FeatureTableCell({ value, managed }: { value: boolean | React.ReactNode; managed?: boolean }) {
    if (typeof value === 'boolean') {
      return value ? <CircleCheck className='size-5 inline' /> : <CircleX className='size-5 text-red-900 inline' />;
    }
    return <span className={cn('text-sm', !managed && 'text-muted-foreground')}>{value}</span>;
  }

  return (
    <>
      <div className='py-12 lg:py-20'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center max-w-3xl mx-auto mb-16'>
            <h1 className='text-4xl lg:text-5xl font-bold mb-4'>How does Paklo compare?</h1>
            <p className='text-xl text-muted-foreground'>
              See how our managed service stacks up against other dependency management solutions
            </p>
          </div>

          <div className='overflow-x-auto'>
            <Table className='border-collapse'>
              <TableHeader>
                <TableRow>
                  <TableHead className='text-left p-4 font-semibold'>Feature</TableHead>
                  <TableHead className='text-center p-4 font-semibold bg-brand/20'>
                    <div className='font-bold'>Paklo Managed</div>
                    <div className='text-sm font-normal text-muted-foreground'>
                      {formatMoney(PRICE_AMOUNT_MONTHLY_MANAGEMENT, { whole: true })}/mo + usage <sup>3</sup>
                    </div>
                  </TableHead>
                  <TableHead className='text-center p-4 font-semibold'>
                    <div>Paklo Self-Managed</div>
                    <div className='text-sm font-normal text-muted-foreground'>Free</div>
                  </TableHead>
                  <TableHead className='text-center p-4 font-semibold'>
                    <div>GitHub Dependabot</div>
                    <div className='text-sm font-normal text-muted-foreground'>Free on GitHub</div>
                  </TableHead>
                  <TableHead className='text-center p-4 font-semibold'>
                    <div>Azure DevOps Advanced Security</div>
                    <div className='text-sm font-normal text-muted-foreground'>
                      {formatMoney(AZDO_ADS_PRICE_AMOUNT_MONTHLY, { whole: true })}/user/mo <sup>2</sup>
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {comparison.map((feature) => (
                  <TableRow key={feature.name} className='even:bg-muted/50'>
                    <TableCell className='p-4 font-medium'>{feature.name}</TableCell>
                    <TableCell className='text-center p-4 bg-brand/20'>
                      <FeatureTableCell value={feature.managed} managed />
                    </TableCell>
                    <TableCell className='text-center p-4'>
                      <FeatureTableCell value={feature.selfManaged} />
                    </TableCell>
                    <TableCell className='text-center p-4'>
                      <FeatureTableCell value={feature.github} />
                    </TableCell>
                    <TableCell className='text-center p-4'>
                      <FeatureTableCell value={feature.azureDevOps} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className='mt-8 text-sm text-muted-foreground flex flex-col gap-1'>
            <p>
              <sup>1</sup> GitHub Dependabot is free on GitHub.com but limited to GitHub repositories only.
            </p>
            <p>
              <sup>2</sup> Other providers may change pricing/features without notice; last checked December 2025.
            </p>
            <p>
              <sup>3</sup> Paklo Managed pricing is per organization per month, plus usage-based billing for CI minutes.
              See our{' '}
              <Link href='/#pricing' className='underline underline-offset-4'>
                pricing
              </Link>{' '}
              for details.
            </p>
          </div>
        </div>
      </div>

      <div className='py-6 lg:py-10 bg-muted/30'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <Item>
            <ItemMedia>
              <CircleCheckBig />
            </ItemMedia>
            <ItemContent>
              <ItemTitle className='text-lg'>
                If you want Dependabot-style PRs in Azure DevOps without running infra, or paying per-user pricing,
                Paklo Managed is the fastest path.
              </ItemTitle>
            </ItemContent>
          </Item>
        </div>
      </div>

      <div className='py-12 lg:py-20'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center'>
            <h2 className='text-3xl font-bold mb-4'>Ready to get started?</h2>
            <p className='text-muted-foreground mb-8'>Start securing your dependencies today with Paklo Managed</p>
            <Link href='/signup'>
              <Button size='lg' variant='brand'>
                Get Started Now
                <ArrowRight className='ml-2 h-4 w-4' />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
