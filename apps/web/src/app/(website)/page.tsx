import { ArrowRight, Check, Globe, Layers, Lock, Shield, Users, Zap } from 'lucide-react';
import Link from 'next/link';
import { numify } from 'numify';
import { getHomePageStats } from '@/actions/stats';
import type { Icon } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/components/ui/item';
import { INCLUDED_USAGE_MINUTES } from '@/lib/billing';
import { extensions } from '@/site-config';

type FeatureEntry = { title: string; description: string; icon: Icon };
const features: FeatureEntry[] = [
  {
    title: 'Real-time Scanning',
    description: 'Continuous monitoring of your dependencies for known vulnerabilities across all ecosystems',
    icon: Shield,
  },
  {
    title: 'Automated Updates',
    description: 'Smart PRs that keep your dependencies up-to-date while respecting your version constraints',
    icon: Zap,
  },
  {
    title: 'Private Advisories',
    description: 'Create and manage internal security advisories for proprietary code and dependencies',
    icon: Lock,
  },
  {
    title: 'Team Collaboration',
    description: 'Add team members to your organization to collaborate on security',
    icon: Users,
  },
  {
    title: 'Multi-Platform Support',
    description: 'Works seamlessly with Azure DevOps repositories with more platforms coming soon',
    icon: Layers,
  },
  {
    title: 'Global Infrastructure',
    // description: 'Deploy in UK, US, EU, or Australia with more regions coming soon',
    description: 'Deploy in UK or EU with more regions coming soon',
    icon: Globe,
  },
];
const pricing = {
  free: {
    features: [
      'Full feature access',
      'Unlimited projects (private & public)',
      'Self-hosted infrastructure',
      'Community support',
      'Open source',
    ],
  },
  paid: {
    monthly: '$20',
    features: [
      'Everything in Self-Managed',
      `${INCLUDED_USAGE_MINUTES.toLocaleString()} minutes/month included ($0.06/min after)`,
      'Fully managed infrastructure',
      'Managed Private advisories',
      'PR comments',
      'Multi-ecosystem pull requests',
      'Team collaboration',
    ],
  },
};

export default async function HomePage() {
  const { installations, runs } = await getHomePageStats('90d');
  const installationsTruncated = Math.floor(installations / 100) * 100; // 4458 -> 4400

  const stats = [
    { name: 'Installations', value: numify(installations) },
    { name: 'Total run time (90d)', value: numify(Math.round(runs.duration / 60)), unit: 'mins' },
    { name: 'Number of jobs (90d)', value: numify(runs.count) },
  ];

  return (
    <>
      {/* Hero */}
      <section className='relative py-12 lg:py-20 overflow-hidden'>
        <div className='absolute inset-0 bg-grid-white/[0.02] bg-size-[50px_50px]' />
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative'>
          <div className='text-center max-w-4xl mx-auto'>
            <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm mb-6'>
              <Shield className='size-4' />
              Trusted by {numify(installationsTruncated)}+ engineering teams
            </div>
            <h1 className='text-4xl lg:text-6xl font-bold mb-6 text-balance'>
              Secure your dependencies, <span className='text-primary'>ship with confidence</span>
            </h1>
            <p className='text-xl text-muted-foreground mb-8 max-w-2xl lg:max-w-3xl mx-auto text-balance'>
              Automated vulnerability scanning and dependency management for modern development teams. Keep your code
              secure without slowing down.
            </p>
            <div className='flex flex-col sm:flex-row items-center justify-center gap-4'>
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
          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
            {stats.map((stat) => (
              <div key={stat.name} className='text-center'>
                <p className='mb-2'>
                  <span className='text-3xl font-semibold tracking-tight'>{stat.value}+</span>
                  {stat.unit ? <span className='text-sm ml-2'>{stat.unit}</span> : null}
                </p>
                <p className='text-lg text-muted-foreground'>{stat.name}</p>
              </div>
            ))}
          </div>
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

            <Card className='border-brand border-2 relative'>
              <Badge variant='brand' className='absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1'>
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
    </>
  );
}
