import { notFound } from 'next/navigation';
import { AzureRestError, BLOB_CONTAINER_NAME_LOGS, getClients } from '@/lib/azure';
import { prisma } from '@/lib/prisma';

export const revalidate = 0; // always revalidate to get the latest

export async function GET(_req: Request, params: RouteContext<'/dashboard/[org]/runs/[id]/logs'>) {
  const { org: organizationId, id } = await params.params;

  const organization = await prisma.organization.findUnique({
    where: { slug: organizationId },
    select: { id: true },
  });
  if (!organization) return notFound();

  // get the update job to ensure it exists and belongs to the organization
  const updateJob = await prisma.updateJob.findFirst({
    // must belong to an organization they are a member of (the active one)
    where: { id, organizationId: organization.id },
  });
  if (!updateJob) return notFound();

  const { blobs: client } = getClients(updateJob.region);
  const logsContainer = client.getContainerClient(BLOB_CONTAINER_NAME_LOGS);
  const blobClient = logsContainer.getBlockBlobClient(`${id}.txt`);

  try {
    const download = await blobClient.download();

    if (!download.readableStreamBody) {
      return Response.json({ error: 'No log content available' }, { status: 404 });
    }

    // Logs for completed jobs are immutable and can be cached in the user's browser
    const cacheControl = updateJob.finishedAt
      ? 'private, max-age=31536000, immutable' // 1 year for finished jobs
      : 'private, no-cache, no-store, must-revalidate'; // No caching for running jobs

    // Stream the blob content as plain text
    return new Response(download.readableStreamBody as unknown as ReadableStream, {
      headers: {
        'content-type': download.contentType ?? 'text/plain; charset=utf-8',
        'content-disposition': download.contentDisposition ?? `inline; filename="${id}.txt"`,
        'cache-control': cacheControl,
        ...(download.contentLength && { 'content-length': download.contentLength.toString() }),
      },
    });
  } catch (error) {
    if (error instanceof AzureRestError && error.statusCode === 404) {
      return Response.json({ error: 'Logs not found' }, { status: 404 });
    }
    throw error;
  }
}
