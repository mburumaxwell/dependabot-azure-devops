import { headers as requestHeaders } from 'next/headers';
import { notFound, unauthorized } from 'next/navigation';
import { auth } from '@/lib/auth';
import { AzureRestError, logsContainer } from '@/lib/azure';
import { prisma } from '@/lib/prisma';

export const revalidate = 0; // always revalidate to get the latest

export async function GET(_req: Request, params: RouteContext<'/dashboard/runs/[id]/logs'>) {
  const { id } = await params.params;

  const headers = await requestHeaders();
  const session = (await auth.api.getSession({ headers }))!;

  const organizationId = session.session.activeOrganizationId;
  if (!organizationId) {
    unauthorized();
  }

  // get the update job to ensure it exists and belongs to the organization
  const updateJob = await prisma.updateJob.findFirst({
    // must belong to an organization they are a member of (the active one)
    where: { id, organizationId },
  });
  if (!updateJob) {
    notFound();
  }

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
