import { ArrowRight, Check, Shield } from 'lucide-react';
import Link from 'next/link';
import { numify } from 'numify';
import * as React from 'react';
import { getHomePageStats, getInstallations } from '@/actions/stats';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/components/ui/item';
import { Skeleton } from '@/components/ui/skeleton';
import { extensions } from '@/site-config';
import { faqs, features, pricing } from './page.data';

export default async function HomePage() {
  const truncate = (num: number, places: number) => Math.floor(num / 10 ** places) * 10 ** places;
  const installations = truncate(await getInstallations(extensions.azure.id), 2); // 4458 -> 4400

  return (
    <>
      {/* Hero */}
      <section className='relative py-12 lg:py-20 overflow-hidden'>
        <div className='absolute inset-0 bg-grid-white/[0.02] bg-size-[50px_50px]' />
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative'>
          <div className='text-center max-w-4xl mx-auto'>
            <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm mb-6'>
              <Shield className='size-4' />
              Trusted by {numify(installations)}+ engineering teams
            </div>
            <h1 className='text-4xl lg:text-6xl font-bold mb-6 text-balance'>
              Secure your dependencies, <span className='text-primary'>ship with confidence</span>
            </h1>
            <p className='text-xl text-muted-foreground mb-8 max-w-2xl lg:max-w-3xl mx-auto text-balance'>
              Automated vulnerability scanning and dependency management for modern development teams. Keep your code
              secure without slowing down.
            </p>
            <div className='flex flex-col sm:flex-row items-center justify-center gap-4'>
              <Link href='/compare'>
                <Button size='lg' variant='outline' className='w-full sm:w-auto'>
                  Compare
                </Button>
              </Link>
              <Link href='/signup'>
                <Button size='lg' variant='brand' className='w-full sm:w-auto'>
                  Get Started
                  <ArrowRight className='ml-2 size-4' />
                </Button>
              </Link>
            </div>
          </div>

          <div className='mt-16 relative'>
            <div className='absolute inset-0 bg-linear-to-t from-background via-transparent to-transparent z-10' />
            <Card className='overflow-hidden border-2'>
              <CardContent className='p-0'>
                <div className='bg-muted/50 p-8 grid grid-cols-1 md:grid-cols-3 gap-6'>
                  <div className='space-y-3'>
                    <div className='flex items-center gap-2 text-sm font-medium'>
                      <div className='size-3 rounded-full bg-red-500' />
                      Critical: 2
                    </div>
                    <div className='flex items-center gap-2 text-sm font-medium'>
                      <div className='size-3 rounded-full bg-orange-500' />
                      High: 5
                    </div>
                    <div className='flex items-center gap-2 text-sm font-medium'>
                      <div className='size-3 rounded-full bg-yellow-500' />
                      Medium: 12
                    </div>
                  </div>
                  <div className='md:col-span-2 space-y-2'>
                    <div className='bg-background rounded p-3 border text-sm'>
                      <span className='text-red-500 font-mono'>CVE-2024-12345</span> detected in react-dom@18.2.0
                    </div>
                    <div className='bg-background rounded p-3 border text-sm opacity-60'>
                      <span className='text-orange-500 font-mono'>CVE-2024-54321</span> detected in axios@1.4.0
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className='py-12 lg:py-20'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <React.Suspense fallback={<StatsSectionSkeleton />}>
            <StatsSection installations={installations} />
          </React.Suspense>
        </div>
      </section>

      {/* Features */}
      <section id='features' className='py-12 lg:py-20 bg-muted/30'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center max-w-3xl mx-auto mb-16'>
            <h2 className='text-3xl lg:text-4xl font-bold mb-4'>Everything you need to stay secure</h2>
            <p className='text-xl text-muted-foreground'>
              Comprehensive security monitoring and automated updates for your entire stack
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
            {features.map(({ icon: Icon, ...feature }) => (
              <Item key={feature.title} variant='outline' className='p-6'>
                <ItemMedia variant='image' className='bg-primary/10 rounded-lg'>
                  <Icon />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle className='text-xl'>{feature.title}</ItemTitle>
                  <ItemDescription className='line-clamp-none'>{feature.description}</ItemDescription>
                </ItemContent>
              </Item>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id='pricing' className='py-12 lg:py-20'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center max-w-3xl mx-auto mb-16'>
            <h2 className='text-3xl lg:text-4xl font-bold mb-4'>Simple, transparent pricing</h2>
            <p className='text-xl text-muted-foreground'>Choose the option that works best for you</p>
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto'>
            <Card>
              <CardContent className='p-8'>
                <div className='mb-6'>
                  <h3 className='font-bold mb-2'>Self-Managed</h3>
                  <div className='flex items-baseline gap-2 mb-4'>
                    <span className='text-2xl'>Free Forever</span>
                  </div>
                  <p className='text-sm text-muted-foreground'>Install and run the extension yourself</p>
                </div>
                <a href={extensions.azure.url} target='_blank' rel='noopener noreferrer'>
                  <Button variant='outline' className='w-full mb-6 bg-transparent'>
                    Get Extension
                  </Button>
                </a>
                <ul className='space-y-3'>
                  {pricing.free.features.map((feature) => (
                    <li key={feature} className='flex items-start gap-2'>
                      <Check className='size-5 text-primary shrink-0 mt-0.5' />
                      <span className='text-sm'>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className='border-brand border-2 relative overflow-visible'>
              <Badge variant='brand' className='absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-3'>
                Recommended
              </Badge>
              <CardContent className='p-8'>
                <div className='mb-6'>
                  <h3 className='font-bold mb-2'>Managed</h3>
                  <div className='flex items-baseline gap-2 mb-4'>
                    <span className='text-2xl'>{pricing.paid.monthly}</span>
                    <span className='text-muted-foreground'>/organization/month</span>
                  </div>
                  <p className='text-sm text-muted-foreground'>Fully managed cloud service</p>
                </div>
                <Link href='/signup'>
                  <Button variant='brand' className='w-full mb-6'>
                    Get Started
                  </Button>
                </Link>
                <ul className='space-y-3'>
                  {pricing.paid.features.map((feature) => (
                    <li key={feature} className='flex items-start gap-2'>
                      <Check className='size-5 text-primary shrink-0 mt-0.5' />
                      <span className='text-sm'>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section id='faqs' className='py-12 lg:py-20 bg-muted/30'>
        <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center mb-16'>
            <h2 className='text-3xl lg:text-4xl font-bold mb-4'>Frequently Asked Questions</h2>
            <p className='text-xl text-muted-foreground'>Everything you need to know about Paklo</p>
          </div>

          <Accordion type='single' collapsible className='space-y-2'>
            {faqs.map((faq) => (
              <AccordionItem
                key={faq.question}
                value={faq.question}
                className='bg-background rounded-lg border px-6 last:border-b'
              >
                <AccordionTrigger className='text-left underline-offset-4'>{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </>
  );
}

async function StatsSection({ installations }: { installations: number }) {
  const runs = await getHomePageStats('90d');
  const stats = [
    { name: 'Installations', value: numify(installations) },
    { name: 'Total run time (90d)', value: numify(Math.round(runs.duration / 60)), unit: 'mins' },
    { name: 'Number of jobs (90d)', value: numify(runs.count) },
  ];

  return (
    <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
      {stats.map((stat) => (
        <div key={stat.name} className='text-center'>
          <p className='mb-2'>
            <span className='text-3xl font-semibold tracking-tight'>{stat.value}</span>
            {stat.unit ? <span className='text-sm ml-2'>{stat.unit}</span> : null}
          </p>
          <p className='text-lg text-muted-foreground'>{stat.name}</p>
        </div>
      ))}
    </div>
  );
}

async function StatsSectionSkeleton() {
  return (
    <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
      {[1, 2, 3].map((stat) => (
        <div key={stat} className='text-center'>
          {/* <div className='mb-2 h-8 w-24 mx-auto bg-muted animate-pulse rounded' /> */}
          <Skeleton className='mb-2 h-8 w-24 mx-auto' />
          {/* <div className='h-5 w-32 mx-auto bg-muted animate-pulse rounded' /> */}
          <Skeleton className='h-5 w-32 mx-auto' />
        </div>
      ))}
    </div>
  );
}
