import type { Metadata } from 'next';
import { headers as requestHeaders } from 'next/headers';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Usage',
  description: 'View your organization usage',
  openGraph: { url: `/dashboard/settings/usage` },
};

export default async function UsagePage() {
  const headers = await requestHeaders();
  const session = await auth.api.getSession({ headers });
  if (!session || !session.session.activeOrganizationId) return null;

  const organizationId = session.session.activeOrganizationId;
  const organization = await prisma.organization.findUniqueOrThrow({
    where: { id: organizationId },
  });
  if (!organization) return null;

  const projectsCount = await prisma.project.count({
    where: { organizationId: organization.id },
  });

  const values = [
    {
      title: 'Projects',
      description: 'Number of active projects',
      used: projectsCount,
      limit: organization.maxProjects,
    },
    {
      title: 'Update Runs',
      description: 'Total runtime in minutes',
      used: 1, // TODO: get actual run minutes
      limit: 50, // TODO: get actual max included minutes
    },
  ];

  return (
    <div className='p-6 w-full max-w-5xl mx-auto space-y-6'>
      <div>
        <h1 className='text-3xl font-semibold mb-2'>Usage</h1>
        <p className='text-muted-foreground'>Monitor your organization's resource usage</p>
      </div>

      <div className='grid gap-6 md:grid-cols-2'>
        {values.map((value) => {
          const percentage = (value.used / value.limit) * 100;
          return (
            <Card key={value.title}>
              <CardHeader>
                <CardTitle>{value.title}</CardTitle>
                <CardDescription>{value.description}</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex items-end gap-2'>
                  <span className='text-4xl font-bold'>{value.used}</span>
                  <span className='text-muted-foreground mb-1'>/ {value.limit} provisioned</span>
                </div>
                <Progress value={percentage} className='h-2' />
                <div className='flex items-center justify-between text-sm'>
                  <span className='text-muted-foreground'>{percentage.toFixed(0)}% used</span>
                  <Badge variant={percentage > 80 ? 'destructive' : 'secondary'}>
                    {(value.limit - value.used).toLocaleString()} remaining
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
