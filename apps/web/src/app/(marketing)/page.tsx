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
      <section className='relative overflow-hidden py-12 lg:py-20'>
        <div className='absolute inset-0 bg-grid-white/[0.02] bg-size-[50px_50px]' />
        <div className='relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div className='mx-auto max-w-4xl text-center'>
            <div className='mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-primary text-sm'>
              <Shield className='size-4' />
              Trusted by {numify(installations)}+ engineering teams
            </div>
            <h1 className='mb-6 text-balance font-bold text-4xl lg:text-6xl'>
              Secure your dependencies, <span className='text-primary'>ship with confidence</span>
            </h1>
            <p className='mx-auto mb-8 max-w-2xl text-balance text-muted-foreground text-xl lg:max-w-3xl'>
              Automated vulnerability scanning and dependency management for modern development teams. Keep your code
              secure without slowing down.
            </p>
            <div className='flex flex-col items-center justify-center gap-4 sm:flex-row'>
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

          <div className='relative mt-16'>
            <div className='absolute inset-0 z-10 bg-linear-to-t from-background via-transparent to-transparent' />
            <Card className='overflow-hidden border-2'>
              <CardContent className='p-0'>
                <div className='grid grid-cols-1 gap-6 bg-muted/50 p-8 md:grid-cols-3'>
                  <div className='space-y-3'>
                    <div className='flex items-center gap-2 font-medium text-sm'>
                      <div className='size-3 rounded-full bg-red-500' />
                      Critical: 2
                    </div>
                    <div className='flex items-center gap-2 font-medium text-sm'>
                      <div className='size-3 rounded-full bg-orange-500' />
                      High: 5
                    </div>
                    <div className='flex items-center gap-2 font-medium text-sm'>
                      <div className='size-3 rounded-full bg-yellow-500' />
                      Medium: 12
                    </div>
                  </div>
                  <div className='space-y-2 md:col-span-2'>
                    <div className='rounded border bg-background p-3 text-sm'>
                      <span className='font-mono text-red-500'>CVE-2024-12345</span> detected in react-dom@18.2.0
                    </div>
                    <div className='rounded border bg-background p-3 text-sm opacity-60'>
                      <span className='font-mono text-orange-500'>CVE-2024-54321</span> detected in axios@1.4.0
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className='py-12 lg:py-20'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <React.Suspense fallback={<StatsSectionSkeleton />}>
            <StatsSection installations={installations} />
          </React.Suspense>
        </div>
      </section>

      {/* Features */}
      <section id='features' className='bg-muted/30 py-12 lg:py-20'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div className='mx-auto mb-16 max-w-3xl text-center'>
            <h2 className='mb-4 font-bold text-3xl lg:text-4xl'>Everything you need to stay secure</h2>
            <p className='text-muted-foreground text-xl'>
              Comprehensive security monitoring and automated updates for your entire stack
            </p>
          </div>

          <div className='grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3'>
            {features.map(({ icon: Icon, ...feature }) => (
              <Item key={feature.title} variant='outline' className='p-6'>
                <ItemMedia variant='image' className='rounded-lg bg-primary/10'>
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
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div className='mx-auto mb-16 max-w-3xl text-center'>
            <h2 className='mb-4 font-bold text-3xl lg:text-4xl'>Simple, transparent pricing</h2>
            <p className='text-muted-foreground text-xl'>Choose the option that works best for you</p>
          </div>

          <div className='mx-auto grid max-w-4xl grid-cols-1 gap-8 lg:grid-cols-2'>
            <Card>
              <CardContent className='p-8'>
                <div className='mb-6'>
                  <h3 className='mb-2 font-bold'>Self-Managed</h3>
                  <div className='mb-4 flex items-baseline gap-2'>
                    <span className='text-2xl'>Free Forever</span>
                  </div>
                  <p className='text-muted-foreground text-sm'>Install and run the extension yourself</p>
                </div>
                <a href={extensions.azure.url} target='_blank' rel='noopener noreferrer'>
                  <Button variant='outline' className='mb-6 w-full bg-transparent'>
                    Get Extension
                  </Button>
                </a>
                <ul className='space-y-3'>
                  {pricing.free.features.map((feature) => (
                    <li key={feature} className='flex items-start gap-2'>
                      <Check className='mt-0.5 size-5 shrink-0 text-primary' />
                      <span className='text-sm'>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className='relative overflow-visible border-2 border-brand'>
              <Badge variant='brand' className='absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-3'>
                Recommended
              </Badge>
              <CardContent className='p-8'>
                <div className='mb-6'>
                  <h3 className='mb-2 font-bold'>Managed</h3>
                  <div className='mb-4 flex items-baseline gap-2'>
                    <span className='text-2xl'>{pricing.paid.monthly}</span>
                    <span className='text-muted-foreground'>/organization/month</span>
                  </div>
                  <p className='text-muted-foreground text-sm'>Fully managed cloud service</p>
                </div>
                <Link href='/signup'>
                  <Button variant='brand' className='mb-6 w-full'>
                    Get Started
                  </Button>
                </Link>
                <ul className='space-y-3'>
                  {pricing.paid.features.map((feature) => (
                    <li key={feature} className='flex items-start gap-2'>
                      <Check className='mt-0.5 size-5 shrink-0 text-primary' />
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
      <section id='faqs' className='bg-muted/30 py-12 lg:py-20'>
        <div className='mx-auto max-w-4xl px-4 sm:px-6 lg:px-8'>
          <div className='mb-16 text-center'>
            <h2 className='mb-4 font-bold text-3xl lg:text-4xl'>Frequently Asked Questions</h2>
            <p className='text-muted-foreground text-xl'>Everything you need to know about Paklo</p>
          </div>

          <Accordion type='single' collapsible className='space-y-2'>
            {faqs.map((faq) => (
              <AccordionItem
                key={faq.question}
                value={faq.question}
                className='rounded-lg border bg-background px-6 last:border-b'
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
    <div className='grid grid-cols-1 gap-8 md:grid-cols-3'>
      {stats.map((stat) => (
        <div key={stat.name} className='text-center'>
          <p className='mb-2'>
            <span className='font-semibold text-3xl tracking-tight'>{stat.value}</span>
            {stat.unit ? <span className='ml-2 text-sm'>{stat.unit}</span> : null}
          </p>
          <p className='text-lg text-muted-foreground'>{stat.name}</p>
        </div>
      ))}
    </div>
  );
}

async function StatsSectionSkeleton() {
  return (
    <div className='grid grid-cols-1 gap-8 md:grid-cols-3'>
      {[1, 2, 3].map((stat) => (
        <div key={stat} className='text-center'>
          {/* <div className='mb-2 h-8 w-24 mx-auto bg-muted animate-pulse rounded' /> */}
          <Skeleton className='mx-auto mb-2 h-8 w-24' />
          {/* <div className='h-5 w-32 mx-auto bg-muted animate-pulse rounded' /> */}
          <Skeleton className='mx-auto h-5 w-32' />
        </div>
      ))}
    </div>
  );
}
