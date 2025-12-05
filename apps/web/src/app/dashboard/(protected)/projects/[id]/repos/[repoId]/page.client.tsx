'use client';

import { Download, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { EcosystemIcon, JobStatusIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Item, ItemActions, ItemContent, ItemGroup, ItemMedia, ItemTitle } from '@/components/ui/item';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getRepositoryFileUrl } from '@/lib/organizations';
import type { Organization, Project, Repository, RepositoryUpdate, UpdateJob } from '@/lib/prisma';
import { cn, trimLeadingSlash } from '@/lib/utils';

type SimpleProject = Pick<Project, 'id' | 'name' | 'organizationId'> & {
  organization: Pick<Organization, 'type'>;
};
type SimpleRepository = Pick<
  Repository,
  'id' | 'name' | 'url' | 'slug' | 'updatedAt' | 'synchronizationStatus' | 'synchronizedAt'
>;
type SimpleRepositoryUpdate = Pick<RepositoryUpdate, 'id' | 'ecosystem' | 'files'> & {
  latestUpdateJob: Pick<UpdateJob, 'id' | 'status'> | null;
};

export function RepositoryView({
  project,
  repository,
  updates,
  sbomAllowed,
}: {
  project: SimpleProject;
  repository: SimpleRepository;
  updates: SimpleRepositoryUpdate[];
  sbomAllowed: boolean;
}) {
  const organizationType = project.organization.type;

  const fileLinks: Map<string, string> = new Map(
    updates
      .flatMap((update) => update.files)
      .map((file) => [
        file,
        getRepositoryFileUrl({
          type: organizationType,
          url: repository.url,
          file,
        }),
      ]),
  );

  return (
    <div className='p-6 w-full max-w-5xl mx-auto space-y-6'>
      <div className='grid gap-4 grid-cols-1 md:grid-cols-3 items-center justify-center'>
        <div className='md:col-span-2'>
          <h1 className='text-2xl font-semibold mb-2'>Repository: {repository.name}</h1>
          <p className='text-muted-foreground text-sm'>
            <a href={repository.url} target='_blank' rel='noreferrer' className='hover:underline underline-offset-4'>
              {repository.slug}
            </a>
          </p>
        </div>
        <Button
          className='mt-4 md:w-full lg:mt-0 lg:justify-self-end lg:w-auto'
          disabled={!sbomAllowed}
          asChild={sbomAllowed}
        >
          <Link
            href={`/dashboard/projects/${project.id}/repos/${repository.id}/sbom`}
            className={cn(!sbomAllowed && 'flex flex-row')}
          >
            <Download className='mr-2 size-4' />
            Export SBOM
          </Link>
        </Button>
      </div>
      <Tabs defaultValue='updates'>
        <TabsList className='w-full mb-2'>
          <TabsTrigger value='dependencies'>Dependencies</TabsTrigger>
          <TabsTrigger value='updates'>Updates</TabsTrigger>
        </TabsList>
        <TabsContent value='dependencies'>
          <Card>
            <CardContent className='flex items-center justify-center min-h-100'>
              <div className='text-center space-y-2'>
                <p className='text-muted-foreground text-lg'>Coming Soon</p>
                <p className='text-sm text-muted-foreground'>Dependency visualization will be available soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value='updates'>
          <ItemGroup className='space-y-4'>
            {updates.map((update) => (
              <Item key={update.id} variant='outline'>
                <ItemMedia variant='icon'>
                  <EcosystemIcon ecosystem={update.ecosystem} className='size-5' />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>
                    {update.files.length ? (
                      <div className='flex flex-row gap-2 items-center'>
                        <a
                          className='hover:underline hover:cursor-pointer underline-offset-4'
                          href={fileLinks.get(update.files[0]!)}
                          target='_blank'
                          rel='noreferrer'
                        >
                          {trimLeadingSlash(update.files[0]!)}
                        </a>
                        {update.files.length > 1 && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant='ghost' size='icon'>
                                <MoreHorizontal className='size-4' />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuLabel className='text-xs font-light'>Monitored files</DropdownMenuLabel>
                              {update.files.slice(1).map((file) => (
                                <DropdownMenuItem key={file} asChild>
                                  <a href={fileLinks.get(file)} target='_blank' rel='noreferrer'>
                                    {trimLeadingSlash(file)}
                                  </a>
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    ) : (
                      <>Updating ...</>
                    )}
                  </ItemTitle>
                </ItemContent>
                <ItemActions>
                  {/* Show icon if the latest update job status is not succeeded */}
                  {update.latestUpdateJob?.status && update.latestUpdateJob.status !== 'succeeded' && (
                    <JobStatusIcon status={update.latestUpdateJob.status} className='size-5' />
                  )}
                  <Link
                    href={`/dashboard/projects/${project.id}/repos/${repository.id}/updates/${update.id}/jobs`}
                    className='hover:underline underline-offset-4 text-blue-500'
                  >
                    Recent update jobs
                  </Link>
                </ItemActions>
              </Item>
            ))}
          </ItemGroup>
        </TabsContent>
      </Tabs>
    </div>
  );
}
