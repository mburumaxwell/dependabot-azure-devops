'use server';

import { logger } from '@/lib/logger';
import { getWebhooksUrl } from '@/lib/organization-types';
import { type OrganizationType, prisma } from '@/lib/prisma';

export async function getWebhooksToken({ organizationId }: { organizationId: string }) {
  const credential = await prisma.organizationCredential.findUniqueOrThrow({
    where: { id: organizationId },
    select: { webhooksToken: true },
  });

  return credential.webhooksToken;
}

export async function validateWebhooks({
  id,
  type,
}: {
  id: string;
  type: OrganizationType;
}): Promise<{ success: boolean; valid: boolean; message?: string }> {
  const credential = await prisma.organizationCredential.findUniqueOrThrow({
    where: { id: id },
    select: { webhooksToken: true },
  });

  const webhooksUrl = getWebhooksUrl({ id, type });
  logger.trace(
    `Validating webhooks for organization ${id} sending to ${webhooksUrl} with token ${credential.webhooksToken}`,
  );

  // TODO: validate webhooks (service hook subscriptions) exist
  await new Promise((resolve) => setTimeout(resolve, 5000)); // simulate async work

  return { success: true, valid: true };
}

export async function createWebhooks({
  id,
  type,
}: {
  id: string;
  type: OrganizationType;
}): Promise<{ success: boolean; message?: string }> {
  const credential = await prisma.organizationCredential.findUniqueOrThrow({
    where: { id: id },
    select: { webhooksToken: true },
  });

  const webhooksUrl = getWebhooksUrl({ id, type });
  logger.trace(
    `Creating webhooks for organization ${id} sending to ${webhooksUrl} with token ${credential.webhooksToken}`,
  );

  // TODO: create webhooks (service hook subscriptions) using the token
  await new Promise((resolve) => setTimeout(resolve, 5000)); // simulate async work

  return { success: true };
}
