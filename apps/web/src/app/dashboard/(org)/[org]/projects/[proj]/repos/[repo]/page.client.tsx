'use client';

import { Download, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { EcosystemIcon, UpdateJobStatusIcon } from '@/components/icons';
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
import { trimLeadingSlash } from '@/lib/utils';

type SimpleOrganization = Pick<Organization, 'id' | 'slug'>;
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
  organization,
  project,
  repository,
  updates,
}: {
  organization: SimpleOrganization;
  project: SimpleProject;
  repository: SimpleRepository;
  updates: SimpleRepositoryUpdate[];
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
    <div className='mx-auto w-full max-w-5xl space-y-6 p-6'>
      <div className='grid grid-cols-1 items-center justify-center gap-4 md:grid-cols-3'>
        <div className='md:col-span-2'>
          <h1 className='mb-2 font-semibold text-2xl'>Repository: {repository.name}</h1>
          <p className='text-muted-foreground text-sm'>
            <a href={repository.url} target='_blank' rel='noreferrer' className='underline-offset-4 hover:underline'>
              {repository.slug}
            </a>
          </p>
        </div>
        <Button className='mt-4 md:w-full lg:mt-0 lg:w-auto lg:justify-self-end' asChild>
          <Link href={`/dashboard/${organization.slug}/projects/${project.id}/repos/${repository.id}/sbom`}>
            <Download className='mr-2 size-4' />
            Export SBOM
          </Link>
        </Button>
      </div>
      <Tabs defaultValue='updates'>
        <TabsList className='mb-2 w-full'>
          <TabsTrigger value='dependencies'>Dependencies</TabsTrigger>
          <TabsTrigger value='updates'>Updates</TabsTrigger>
        </TabsList>
        <TabsContent value='dependencies'>
          <Card>
            <CardContent className='flex min-h-100 items-center justify-center'>
              <div className='space-y-2 text-center'>
                <p className='text-lg text-muted-foreground'>Coming Soon</p>
                <p className='text-muted-foreground text-sm'>Dependency visualization will be available soon</p>
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
                      <div className='flex flex-row items-center gap-2'>
                        <a
                          className='underline-offset-4 hover:cursor-pointer hover:underline'
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
                              <DropdownMenuLabel className='font-light text-xs'>Monitored files</DropdownMenuLabel>
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
                  {update.latestUpdateJob?.status &&
                    !['succeeded', 'scheduled'].includes(update.latestUpdateJob.status) && (
                      <UpdateJobStatusIcon status={update.latestUpdateJob.status} className='size-5' />
                    )}
                  <Link
                    href={`/dashboard/${organization.slug}/projects/${project.id}/repos/${repository.id}/updates/${update.id}/jobs`}
                    className='text-blue-500 underline-offset-4 hover:underline'
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
