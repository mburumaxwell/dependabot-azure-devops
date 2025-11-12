'use client';

import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { PakloLogo } from '@/components/logos';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { authClient, type Organization } from '@/lib/auth-client';
import { getOrganizationTypeInfo } from '@/lib/organization-types';

export function NoOrganizationsView() {
  return (
    <div className='flex items-center justify-center min-h-screen p-6'>
      <Card className='max-w-md w-full'>
        <CardHeader className='text-center pb-4'>
          <div className='mx-auto mb-4 size-12 rounded-full flex items-center justify-center'>
            <PakloLogo className='size-6' />
          </div>
          <CardTitle className='text-2xl'>Welcome to your dashboard</CardTitle>
          <CardDescription className='text-base'>Get started by creating your first organization</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <p className='text-sm text-muted-foreground text-center'>
            Organizations help you manage your projects, team members, and integrations all in one place.
          </p>
          <Button asChild className='w-full' size='lg'>
            <Link href='/dashboard/organization/create'>
              <Plus className='mr-2 size-4' />
              Create your first organization
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function SelectOrganizationView({ organizations }: { organizations: Organization[] }) {
  const router = useRouter();
  const [selectedOrgId, setSelectedOrgId] = useState<string | undefined>(undefined);
  const [settingDefault, setSettingDefault] = useState(false);

  async function handleSetDefault() {
    if (!selectedOrgId) return;

    setSettingDefault(true);
    const { data, error } = await authClient.organization.setActive({
      organizationId: selectedOrgId,
    });
    setSettingDefault(false);

    if (error || !data) {
      toast.error('Failed to set default organization', {
        description: error?.message || 'An unexpected error occurred',
      });
      return;
    }

    // Redirect to dashboard activity page
    router.push('/dashboard/activity');
  }

  return (
    <div className='flex items-center justify-center min-h-screen p-6'>
      <Card className='max-w-md w-full'>
        <CardHeader className='text-center'>
          <div className='mx-auto mb-4 size-12 rounded-full flex items-center justify-center'>
            <PakloLogo className='size-6' />
          </div>
          <CardTitle className='text-xl'>Choose your default organization</CardTitle>
          <CardDescription className='text-sm'>
            Select which organization you'd like to work with by default
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-2'>
            <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
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
          <Button onClick={handleSetDefault} disabled={!selectedOrgId || settingDefault} className='w-full' size='lg'>
            {settingDefault ? (
              <>
                <Spinner className='mr-2' />
                Setting default...
              </>
            ) : (
              'Continue to Dashboard'
            )}
          </Button>
          <p className='text-xs text-muted-foreground text-center'>You can change this at any time in your sidebar.</p>
          <Separator />
          <Button asChild variant='outline' className='w-full bg-transparent'>
            <Link href='/dashboard/organization/create'>
              <Plus className='mr-2 size-4' />
              Create New Organization
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
