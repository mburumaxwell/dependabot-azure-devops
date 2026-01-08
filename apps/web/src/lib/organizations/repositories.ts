import type { OrganizationType } from '@/lib/enums';
import { trimTrailingSlash } from '@/lib/utils';

export function getRepositoryFileUrl({ type, url, file }: { type: OrganizationType; url: string; file: string }) {
  switch (type) {
    case 'azure': {
      // format: `<repository-url>?path=<rooted-path>`
      const parsedUrl = new URL(url);
      parsedUrl.searchParams.set('path', file);
      return parsedUrl.toString();
    }
    default:
      throw new Error(`Unsupported organization type: ${type}`);
  }
}
export function getPullRequestUrl({ type, url, prId }: { type: OrganizationType; url: string; prId: number }) {
  switch (type) {
    case 'azure': {
      // format: <repository-url>/pullrequest/<pull-request-id>
      return `${trimTrailingSlash(url)}/pullrequest/${prId}`;
    }
    default:
      throw new Error(`Unsupported organization type: ${type}`);
  }
}

export function getSpdxDocumentName({ type, slug }: { type: OrganizationType; slug: string }) {
  switch (type) {
    case 'azure': {
      return `com.azure.dev.${slug}`;
    }
    default:
      throw new Error(`Unsupported organization type: ${type}`);
  }
}
