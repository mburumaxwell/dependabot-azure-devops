'use client';

import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { PakloLogo } from '@/components/logos';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import type { Organization } from '@/lib/auth-client';
import { getOrganizationTypeInfo } from '@/lib/organizations';

export function NoOrganizationsView() {
  return (
    <Card className='w-full max-w-md'>
      <CardHeader className='pb-4 text-center'>
        <div className='mx-auto mb-4 flex size-12 items-center justify-center rounded-full'>
          <PakloLogo className='size-6' />
        </div>
        <CardTitle className='text-2xl'>Welcome to your dashboard</CardTitle>
        <CardDescription className='text-base'>Get started by creating your first organization</CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <p className='text-center text-muted-foreground text-sm'>
          Organizations help you manage your projects, team members, and integrations all in one place.
        </p>
        <Link href='/dashboard/setup'>
          <Button className='w-full' size='lg'>
            <Plus className='mr-2 size-4' />
            Create your first organization
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export function SelectOrganizationView({ organizations }: { organizations: Organization[] }) {
  const router = useRouter();
  const [selectedOrg, setSelectedOrg] = useState<Organization | undefined>(undefined);
  const [navigating, setNavigating] = useState(false);

  async function handleNavigating() {
    if (!selectedOrg) return;

    setNavigating(true);

    // redirect to dashboard activity page
    router.push(`/dashboard/${selectedOrg.slug}`);
  }

  return (
    <Card className='w-full max-w-md'>
      <CardHeader className='text-center'>
        <div className='mx-auto mb-4 flex size-12 items-center justify-center rounded-full'>
          <PakloLogo className='size-6' />
        </div>
        <CardTitle className='text-xl'>Choose your organization</CardTitle>
        <CardDescription className='text-sm'>Select which organization you'd like to work with</CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='space-y-2'>
          <Select
            value={selectedOrg?.id}
            onValueChange={(id) => setSelectedOrg(organizations.find((org) => org.id === id))}
          >
            <SelectTrigger id='org-select' className='w-full'>
              <SelectValue placeholder='Select an organization' />
            </SelectTrigger>
            <SelectContent>
              {organizations.map((org) => (
                <SelectItem key={org.id} value={org.id}>
                  {org.name} ({getOrganizationTypeInfo(org.type)!.name})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleNavigating} disabled={!selectedOrg || navigating} className='w-full' size='lg'>
          {navigating ? (
            <>
              <Spinner className='mr-2' />
              Navigating...
            </>
          ) : (
            'Continue to Dashboard'
          )}
        </Button>
        <p className='text-center text-muted-foreground text-xs'>You can change this at any time in your sidebar.</p>
        <Separator />
        <Link href='/dashboard/setup'>
          <Button variant='outline' className='w-full bg-transparent'>
            <Plus className='mr-2 size-4' />
            Create New Organization
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
