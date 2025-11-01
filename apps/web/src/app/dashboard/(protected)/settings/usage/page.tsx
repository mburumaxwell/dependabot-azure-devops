import type { Metadata } from 'next';
import { headers as requestHeaders } from 'next/headers';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { auth } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Usage',
  description: 'View your organization usage',
  openGraph: { url: `/dashboard/settings/usage` },
};

export default async function UsagePage() {
  const headers = await requestHeaders();
  const organization = await auth.api.getFullOrganization({ headers });

  const usage = {
    projects: {
      used: 1, // TODO: get actual projects count
      provisioned: organization?.maxProjects || 1,
    },
    minutes: {
      used: 1, // TODO: get actual run minutes
      limit: 50, // TODO: get actual max included minutes
    },
  };

  const projectsPercentage = (usage.projects.used / usage.projects.provisioned) * 100;
  const minutesPercentage = (usage.minutes.used / usage.minutes.limit) * 100;

  return (
    <div className='p-6 w-full max-w-5xl mx-auto space-y-6'>
      <div>
        <h1 className='text-3xl font-semibold mb-2'>Usage</h1>
        <p className='text-muted-foreground'>Monitor your organization's resource usage</p>
      </div>

      <div className='grid gap-6 md:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle>Projects</CardTitle>
            <CardDescription>Number of active projects</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex items-end gap-2'>
              <span className='text-4xl font-bold'>{usage.projects.used}</span>
              <span className='text-muted-foreground mb-1'>/ {usage.projects.provisioned} provisioned</span>
            </div>
            <Progress value={projectsPercentage} className='h-2' />
            <div className='flex items-center justify-between text-sm'>
              <span className='text-muted-foreground'>{projectsPercentage.toFixed(0)}% used</span>
              <Badge variant={projectsPercentage > 80 ? 'destructive' : 'secondary'}>
                {usage.projects.provisioned - usage.projects.used} remaining
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Update Runs</CardTitle>
            <CardDescription>Total runtime in minutes</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex items-end gap-2'>
              <span className='text-4xl font-bold'>{usage.minutes.used.toLocaleString()}</span>
              <span className='text-muted-foreground mb-1'>/ {usage.minutes.limit.toLocaleString()} minutes</span>
            </div>
            <Progress value={minutesPercentage} className='h-2' />
            <div className='flex items-center justify-between text-sm'>
              <span className='text-muted-foreground'>{minutesPercentage.toFixed(1)}% used</span>
              <Badge variant={minutesPercentage > 80 ? 'destructive' : 'secondary'}>
                {(usage.minutes.limit - usage.minutes.used).toLocaleString()} remaining
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
