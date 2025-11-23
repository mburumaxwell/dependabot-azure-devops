import { readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as spdx from '@spdx/tools';
import { notFound } from 'next/navigation';

import { getSpdxDocumentName } from '@/lib/organizations';
import { prisma } from '@/lib/prisma';

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
      new spdx.Actor(`Paklo.com-Dependency-Graph`, spdx.ActorType.Tool),
      new spdx.Actor(`Automatic Dependency Submission`, spdx.ActorType.Tool),
    ],
  );

  // TODO: add packages known for this repository (likely from its updates)
  // ref: https://github.com/mburumaxwell/dependabot-azure-devops/dependency-graph/sbom
  const pkg = document.addPackage('my-package');
  document.addRelationship(document, pkg, 'DESCRIBES');

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
