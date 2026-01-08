export type AzureDevOpsOrganizationUrl = {
  /** URL of the organization. This may lack the project name */
  value: URL;

  /** Organization URL hostname */
  hostname: string;

  /** Organization API endpoint URL */
  'api-endpoint': string;

  /** Organization name/slug */
  organization: string;

  /** Virtual directory if present (on-premises only) */
  'virtual-directory'?: string;

  /**
   * Organization Identity API URL (different from the API endpoint).
   * Used for querying user identities.
   */
  'identity-api-url': URL;
};

export type AzureDevOpsProjectUrl = AzureDevOpsOrganizationUrl & {
  /**
   * Project ID or Name.
   * This value is not URL-encoded, clients must encode it when constructing URLs.
   */
  project: string;
};

export type AzureDevOpsRepositoryUrl = AzureDevOpsProjectUrl & {
  /**
   * Repository ID or Name.
   * This value is not URL-encoded, clients must encode it when constructing URLs.
   */
  repository: string;

  /** Slug of the repository e.g. `contoso/prj1/_git/repo1`, `tfs/contoso/prj1/_git/repo1` */
  'repository-slug': string;
};

export function extractOrganizationUrl({ organizationUrl }: { organizationUrl: string }): AzureDevOpsOrganizationUrl {
  // convert url string into a valid JS URL object
  const value = new URL(organizationUrl);
  const protocol = value.protocol.slice(0, -1);
  let { hostname } = value;
  const visualStudioUrlRegex = /^(?<prefix>\S+)\.visualstudio\.com$/iu;
  if (visualStudioUrlRegex.test(hostname)) hostname = 'dev.azure.com';

  const organization: string = extractOrganization(organizationUrl);

  const virtualDirectory = extractVirtualDirectory(value);
  const apiEndpoint = `${protocol}://${hostname}${value.port ? `:${value.port}` : ''}/${virtualDirectory ? `${virtualDirectory}/` : ''}`;

  // determine identity api url
  // if hosted on Azure DevOps, use the 'vssps.dev.azure.com' domain
  const identityApiUrl =
    hostname === 'dev.azure.com' || hostname.endsWith('.visualstudio.com')
      ? // https://learn.microsoft.com/en-us/rest/api/azure/devops/ims/identities/read-identities
        new URL(`https://vssps.dev.azure.com/${organization}/`)
      : value;

  return {
    value,
    hostname,
    'api-endpoint': apiEndpoint,
    organization,
    'virtual-directory': virtualDirectory,
    'identity-api-url': identityApiUrl,
  };
}

export function extractProjectUrl({
  organizationUrl,
  project,
}: {
  organizationUrl: string;
  project: string;
}): AzureDevOpsProjectUrl {
  const extracted = extractOrganizationUrl({ organizationUrl });
  // Decode to handle already-encoded inputs, store raw for client methods to encode
  const decodedProject = decodeURIComponent(project);

  return {
    ...extracted,
    project: decodedProject,
  };
}

export function extractRepositoryUrl({
  organizationUrl,
  project,
  repository,
}: {
  organizationUrl: string;
  project: string;
  repository: string;
}): AzureDevOpsRepositoryUrl {
  const extracted = extractProjectUrl({ organizationUrl, project });
  const { organization, 'virtual-directory': virtualDirectory, project: decodedProject } = extracted;

  // Decode to handle already-encoded inputs, store raw for client methods to encode
  const decodedRepository = decodeURIComponent(repository);
  // For the slug, encode since it's used in display/logging contexts
  const repoSlug = `${virtualDirectory ? `${virtualDirectory}/` : ''}${organization}/${encodeURI(decodedProject)}/_git/${encodeURI(decodedRepository)}`;

  return {
    ...extracted,
    repository: decodedRepository,
    'repository-slug': repoSlug,
  };
}

/**
 * Extract organization name from organization URL
 *
 * @param organizationUrl
 *
 * @returns organization name
 */
function extractOrganization(organizationUrl: string): string {
  const url = new URL(organizationUrl);
  const { hostname, pathname } = url;

  // Check for old style: https://x.visualstudio.com/
  if (hostname.endsWith('.visualstudio.com')) {
    return hostname.split('.')[0]!;
  }

  // For new style and on-premise, parse the pathname
  // pathname examples: '/contoso/', '/contoso', '/tfs/contoso/', '/tfs/contoso', '/contoso/Core'
  const pathSegments = pathname.split('/').filter((segment) => segment !== '');

  // Check for on-premise style: https://server.domain.com/tfs/contoso/
  if (pathSegments.length >= 2 && hostname !== 'dev.azure.com') {
    return pathSegments[1]!; // Return 'contoso' from '/tfs/contoso/'
  }

  // Check for new style: https://dev.azure.com/contoso/ or https://dev.azure.com/contoso or https://dev.azure.com/contoso/Core
  if (pathSegments.length >= 1) {
    return pathSegments[0]!; // Always return the first path segment for dev.azure.com
  }

  throw new Error(`Error parsing organization from organization url: '${organizationUrl}'.`);
}

/**
 * Extract virtual directory from organization URL
 *
 * Virtual Directories are sometimes used in on-premises
 * @param organizationUrl
 *
 * @returns virtual directory
 *
 * @example URLs typically are like this:`https://server.domain.com/tfs/x/` and `tfs` is the virtual directory
 */
function extractVirtualDirectory(organizationUrl: URL) {
  // extract the pathname from the url then split
  // pathname takes the shape '/tfs/x/'
  const path = organizationUrl.pathname.split('/');

  // Virtual Directories are sometimes used in on-premises
  // URLs typically are like this: https://server.domain.com/tfs/x/
  // The pathname extracted looks like this: '/tfs/x/'
  return path.length === 4 ? path[1]! : undefined;
}
