import type { Metadata } from 'next';
import { headers as requestHeaders } from 'next/headers';
import { BillingNotConfiguredView } from '@/components/billing-not-configured';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ProjectsView } from './page.client';

export const metadata: Metadata = {
  title: 'Projects',
  description: 'View your projects',
  openGraph: { url: `/dashboard/projects` },
};

export default async function ProjectsPage() {
  const headers = await requestHeaders();
  const session = (await auth.api.getSession({ headers }))!;

  const organizationId = session.session.activeOrganizationId;
  if (!organizationId) return null;

  const organization = await prisma.organization.findUniqueOrThrow({
    where: { id: organizationId },
  });

  if (!organization.subscriptionId) {
    return <BillingNotConfiguredView />;
  }

  const projects = await prisma.project.findMany({
    where: { organizationId }, // for the active organization
    select: {
      id: true,
      name: true,
      url: true,
      synchronizationStatus: true,
      synchronizedAt: true,
    },
  });

  return <ProjectsView projects={projects} />;
}
