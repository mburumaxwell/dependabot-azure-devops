'use client';

import { FolderGit2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { type AvailableProject, connectProjects } from '@/actions/projects';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { getOrganizationTypeInfo } from '@/lib/organization-types';
import type { OrganizationType } from '@/lib/prisma';

type ProjectViewProps = {
  organizationId: string;
  type: OrganizationType;
  projects: AvailableProject[];
  maxProjects: number;
};

export function ConnectProjectsView({ organizationId, type, projects, maxProjects }: ProjectViewProps) {
  const router = useRouter();
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
  const [connecting, setConnecting] = useState(false);

  const orgTypeInfo = getOrganizationTypeInfo(type);
  const connectedCount = projects.filter((p) => p.connected).length;
  const totalCount = connectedCount + selectedProjects.size;
  const canSelectMore = totalCount < maxProjects;

  function handleToggleProject(providerId: string) {
    setSelectedProjects((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(providerId)) {
        newSet.delete(providerId);
      } else {
        if (totalCount < maxProjects) {
          newSet.add(providerId);
        }
      }
      return newSet;
    });
  }

  async function handleConnect() {
    if (selectedProjects.size === 0) return;
    const selected = Array.from(selectedProjects).map((id) => projects.find((p) => p.providerId === id)!);

    setConnecting(true);
    try {
      const count = await connectProjects({ organizationId, projects: selected });
      if (count === 0) {
        toast.warning('No projects were connected', {
          description: 'Please try again later.',
        });
        return;
      }

      toast.success('Connected', {
        description: `Successfully connected ${count} project${count > 1 ? 's' : ''}`,
      });
      router.push('/dashboard/projects');
    } catch (error) {
      toast.error('Failed to connect projects', {
        description: (error as Error).message,
      });
    } finally {
      setConnecting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle>Available Projects</CardTitle>
            <CardDescription>Projects from your {orgTypeInfo.name} organization</CardDescription>
          </div>
          <div className='text-right'>
            <p className='text-sm font-medium'>
              {totalCount} of {maxProjects} projects
            </p>
            <p className='text-xs text-muted-foreground'>
              {maxProjects - totalCount} slot{maxProjects - totalCount !== 1 ? 's' : ''} remaining
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='space-y-3'>
          {projects.map((project) => (
            <div key={project.providerId} className='flex items-center justify-between p-4 border rounded-lg'>
              <div className='flex items-center gap-3 flex-1'>
                <Checkbox
                  id={project.providerId}
                  checked={project.connected || selectedProjects.has(project.providerId)}
                  disabled={project.connected || (!selectedProjects.has(project.providerId) && !canSelectMore)}
                  onCheckedChange={() => handleToggleProject(project.providerId)}
                />
                <Label htmlFor={project.providerId} className='flex items-center gap-3 flex-1 cursor-pointer'>
                  <div className='flex size-10 items-center justify-center rounded-lg bg-muted'>
                    <FolderGit2 className='h-5 w-5' />
                  </div>
                  <div>
                    <p className='font-medium'>{project.name}</p>
                    <p className='text-sm text-muted-foreground'>{project.url}</p>
                  </div>
                </Label>
              </div>
              {project.connected && (
                <Badge variant='secondary' className='ml-4'>
                  Connected
                </Badge>
              )}
            </div>
          ))}
        </div>

        {!canSelectMore && (
          <div className='p-4 bg-muted rounded-lg'>
            <p className='text-sm text-muted-foreground'>
              You've reached your project limit. To connect more projects,{' '}
              <Link href='/dashboard/settings/billing' className='text-primary hover:underline'>
                increase your limit
              </Link>
              .
            </p>
          </div>
        )}

        <div className='flex justify-end gap-3 pt-4'>
          <Button variant='outline' asChild>
            <Link href='/dashboard/projects'>Cancel</Link>
          </Button>
          <Button onClick={handleConnect} disabled={selectedProjects.size === 0 || connecting}>
            {connecting ? (
              <>
                <Spinner className='mr-2' />
                Connecting...
              </>
            ) : (
              `Connect ${selectedProjects.size} project${selectedProjects.size !== 1 ? 's' : ''}`
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
