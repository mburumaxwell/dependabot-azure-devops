'use server';

import { prisma } from '@/lib/prisma';

export async function getWebhooksToken({ organizationId }: { organizationId: string }) {
  const credential = await prisma.organizationCredential.findUniqueOrThrow({
    where: { id: organizationId },
    select: { webhooksToken: true },
  });

  return credential.webhooksToken;
}
