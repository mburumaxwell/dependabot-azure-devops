import { readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as spdx from '@spdx/tools';
import { notFound } from 'next/navigation';

import { getSpdxDocumentName } from '@/lib/organizations';
import { type DependabotPersistedDep, prisma } from '@/lib/prisma';

export const revalidate = 0; // always revalidate to get the latest SBOM

export async function GET(_req: Request, params: RouteContext<'/dashboard/projects/[id]/repos/[repoId]/sbom'>) {
  const { id: projectId, repoId: repositoryId } = await params.params;

  // get the repository to ensure it exists and belongs to the project
  const repository = await prisma.repository.findFirst({
    // must belong to the project
    where: { projectId, id: repositoryId },
    include: { project: true },
  });
  if (!repository) {
    notFound();
  }

  // get organization type
  const type = (
    await prisma.organization.findUniqueOrThrow({
      where: { id: repository.project.organizationId },
      select: { type: true },
    })
  ).type;

  const document = spdx.createDocument(getSpdxDocumentName({ type, slug: repository.slug }));
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
  ).flatMap((u) => u.deps as DependabotPersistedDep[]);

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
