import type { OrganizationType } from '@/lib/prisma';

export const HEADER_NAME_ORGANIZATION = 'X-Paklo-Organization';
export const HEADER_NAME_PROJECT = 'X-Paklo-Project';

export function getWebhooksUrl({ type }: { type: OrganizationType }): string {
  return `https://www.paklo.app/api/webhooks/git/${type}`;
}
