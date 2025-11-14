import { z } from 'zod/v4';
import type { OrganizationType } from '@/lib/prisma';

export const AzureDevOpsSubscriptionEventType = z.enum([
  'git.push',
  'git.pullrequest.updated',
  'git.pullrequest.merged',
  'ms.vss-code.git-pullrequest-comment-event',
]);
export type AzureDevOpsSubscriptionEventType = z.infer<typeof AzureDevOpsSubscriptionEventType>;
export type AzureDevOpsSubscriptionEventDescription = {
  type: AzureDevOpsSubscriptionEventType;
  resourceVersion: string;
  description: string;
};

export const AZURE_SUBSCRIPTION_EVENT_TYPES_INFO: Record<
  AzureDevOpsSubscriptionEventType,
  AzureDevOpsSubscriptionEventDescription
> = {
  'git.push': {
    type: 'git.push',
    resourceVersion: '1.0',
    description: `
      Triggered when a push is made to a repository.
      Needed to pick \`dependabot.yml\` files automatically and for safe security vulnerabilities scanning.
    `,
  },
  'git.pullrequest.updated': {
    type: 'git.pullrequest.updated',
    resourceVersion: '1.0',
    description: `
      Triggered when a pull request is updated.
      Needed to manage pull request updates created by Paklo.
    `,
  },
  'git.pullrequest.merged': {
    type: 'git.pullrequest.merged',
    resourceVersion: '1.0',
    description: `
      Triggered when a pull request is merged.
      Needed to manage pull request updates created by Paklo.
    `,
  },
  'ms.vss-code.git-pullrequest-comment-event': {
    type: 'ms.vss-code.git-pullrequest-comment-event',
    resourceVersion: '2.0',
    description: `
      Triggered when a comment is made on a pull request.
      Needed to process dependabot commands in PR comments e.g. \`/dependabot rebase\`.
    `,
  },
};
export const AZURE_SUBSCRIPTION_EVENT_TYPES = Object.keys(
  AZURE_SUBSCRIPTION_EVENT_TYPES_INFO,
) as AzureDevOpsSubscriptionEventType[];

export function getAzureSubscriptionEventInfo(type: AzureDevOpsSubscriptionEventType | string) {
  return AZURE_SUBSCRIPTION_EVENT_TYPES_INFO[type as AzureDevOpsSubscriptionEventType];
}

export function getGeneralWebhookTypes({ type }: { type: OrganizationType }): { type: string; description: string }[] {
  switch (type) {
    case 'azure':
      return Object.values(AZURE_SUBSCRIPTION_EVENT_TYPES_INFO);
    default:
      return [];
  }
}

export function getWebhooksUrl({ id, type }: { id: string; type: OrganizationType }): string {
  return `https://www.paklo.app/api/webhooks/git/${type}/${id}`;
}
