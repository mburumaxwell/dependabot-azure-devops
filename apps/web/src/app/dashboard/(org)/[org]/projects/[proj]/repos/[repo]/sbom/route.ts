import { readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as spdx from '@spdx/tools';
import { notFound } from 'next/navigation';

import { getSpdxDocumentName } from '@/lib/organizations';
import { prisma } from '@/lib/prisma';

export const revalidate = 0; // always revalidate to get the latest SBOM

export async function GET(_req: Request, params: RouteContext<'/dashboard/[org]/projects/[proj]/repos/[repo]/sbom'>) {
  const { org: organizationSlug, proj: projectId, repo: repositoryId } = await params.params;

  // ensure organization exists
  const organization = await prisma.organization.findUnique({
    where: { slug: organizationSlug },
    select: { id: true, type: true },
  });
  if (!organization) return notFound();

  // ensure project exists and belongs to the organization
  const project = await prisma.project.findFirst({
    // must belong to the organization
    where: { organizationId: organization.id, id: projectId },
  });
  if (!project) return notFound();

  // ensure the repository exists and belongs to the project
  const repository = await prisma.repository.findFirst({
    // must belong to the project
    where: { projectId: project.id, id: repositoryId },
  });
  if (!repository) return notFound();

  const document = spdx.createDocument(getSpdxDocumentName({ type: organization.type, slug: repository.slug }));
  document.creationInfo.creators.push(
    ...[
      new spdx.Actor(`Paklo.app-Dependency-Graph`, spdx.ActorType.Tool),
      new spdx.Actor(`Automatic Dependency Submission`, spdx.ActorType.Tool),
    ],
  );

  // get all deps from repository updates
  const deps = (
    await prisma.repositoryUpdate.findMany({
      where: { repositoryId },
      select: { deps: true },
    })
  )
    .flatMap((u) => u.deps)
    .filter(Boolean)
    .map((d) => d!);

  // add each dep to the SBOM
  for (const dep of deps) {
    // ref: https://github.com/mburumaxwell/dependabot-azure-devops/dependency-graph/sbom
    const pkg = document.addPackage(dep.name, {
      version: dep.version ?? 'NOASSERTION',
      downloadLocation: 'NOASSERTION',
    });
    document.addRelationship(document, pkg, 'DESCRIBES');
  }

  // if there are no deps, add a dummy package to indicate no dependencies found
  if (!deps.length) {
    const pkg = document.addPackage('no-dependencies-found', {
      version: '0.0.0',
      downloadLocation: 'NOASSERTION',
    });
    document.addRelationship(document, pkg, 'DESCRIBES');
  }

  // serialize (the library only supports writing to file), delete temp file after reading
  const tmpFile = join(tmpdir(), `sbom-${repositoryId}.json`);
  await document.write(tmpFile);
  const content = await readFile(tmpFile, 'utf-8');
  await rm(tmpFile);

  // generate content-disposition header to suggest a filename and make it downloadable
  // e.g. attachment; filename="paklo_samples__repro-1551_sbom.json"; filename*=UTF-8''paklo_samples__repro-1551_sbom.json
  // only allow alphanumeric, dashes, and underscores
  const filename = `${repository.slug.replace(/[^a-zA-Z0-9-_]/g, '_')}_sbom.json`;
  const contentDispositionHeader = ['attachment', `filename="${filename}"`, `filename*=UTF-8''${filename}`].join('; ');

  return new Response(content, {
    status: 200,
    headers: {
      'content-type': 'application/json',
      'content-disposition': contentDispositionHeader,
    },
  });
}
