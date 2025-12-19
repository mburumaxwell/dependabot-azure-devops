import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BillingNotConfiguredView } from '@/components/billing-not-configured';
import { prisma } from '@/lib/prisma';
import { ProjectsView } from './page.client';

export async function generateMetadata(props: PageProps<'/dashboard/[org]/projects/[proj]'>): Promise<Metadata> {
  const { org: organizationSlug } = await props.params;
  const organization = await getOrganization(organizationSlug);
  if (!organization) return notFound();

  return {
    title: 'Projects',
    description: 'View your projects',
    openGraph: { url: `/dashboard/${organizationSlug}/projects` },
  };
}

export default async function ProjectsPage(props: PageProps<'/dashboard/[org]/projects/[proj]'>) {
  const { org: organizationSlug } = await props.params;
  const organization = await getOrganization(organizationSlug);
  if (!organization) return notFound();

  if (!organization.subscriptionId) {
    return <BillingNotConfiguredView slug={organization.slug} />;
  }

  const projects = await prisma.project.findMany({
    where: { organizationId: organization.id },
    select: {
      id: true,
      name: true,
      url: true,
      synchronizationStatus: true,
      synchronizedAt: true,
    },
  });

  return <ProjectsView organization={organization} projects={projects} />;
}

function getOrganization(slug: string) {
  return prisma.organization.findUnique({ where: { slug }, select: { id: true, slug: true, subscriptionId: true } });
}
