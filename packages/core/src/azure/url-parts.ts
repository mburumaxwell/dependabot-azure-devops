export type AzureDevOpsOrganizationUrl = {
  /** URL of the organisation. This may lack the project name */
  value: URL;

  /** Organisation URL hostname */
  hostname: string;

  /** Organisation API endpoint URL */
  'api-endpoint': string;

  /** Organisation name/slug */
  organisation: string;

  /** Virtual directory if present (on-premises only) */
  'virtual-directory'?: string;

  /**
   * Organization Identity API URL (different from the API endpoint).
   * Used for querying user identities.
   */
  'identity-api-url': URL;
};

export type AzureDevOpsProjectUrl = AzureDevOpsOrganizationUrl & {
  /** Project ID or Name */
  project: string;
};

export type AzureDevOpsRepositoryUrl = AzureDevOpsProjectUrl & {
  /** Repository ID or Name */
  repository: string;

  /** Slug of the repository e.g. `contoso/prj1/_git/repo1`, `tfs/contoso/prj1/_git/repo1` */
  'repository-slug': string;
};

export function extractOrganizationUrl({ organisationUrl }: { organisationUrl: string }): AzureDevOpsOrganizationUrl {
  // convert url string into a valid JS URL object
  const value = new URL(organisationUrl);
  const protocol = value.protocol.slice(0, -1);
  let { hostname } = value;
  const visualStudioUrlRegex = /^(?<prefix>\S+)\.visualstudio\.com$/iu;
  if (visualStudioUrlRegex.test(hostname)) hostname = 'dev.azure.com';

  const organisation: string = extractOrganisation(organisationUrl);

  const virtualDirectory = extractVirtualDirectory(value);
  const apiEndpoint = `${protocol}://${hostname}${value.port ? `:${value.port}` : ''}/${virtualDirectory ? `${virtualDirectory}/` : ''}`;

  // determine identity api url
  // if hosted on Azure DevOps, use the 'vssps.dev.azure.com' domain
  const identityApiUrl =
    hostname === 'dev.azure.com' || hostname.endsWith('.visualstudio.com')
      ? // https://learn.microsoft.com/en-us/rest/api/azure/devops/ims/identities/read-identities
        new URL(`https://vssps.dev.azure.com/${organisation}/`)
      : value;

  return {
    value,
    hostname,
    'api-endpoint': apiEndpoint,
    organisation,
    'virtual-directory': virtualDirectory,
    'identity-api-url': identityApiUrl,
  };
}

export function extractProjectUrl({
  organisationUrl,
  project,
}: {
  organisationUrl: string;
  project: string;
}): AzureDevOpsProjectUrl {
  const extracted = extractOrganizationUrl({ organisationUrl });
  const escapedProject = encodeURI(project); // encode special characters like spaces

  return {
    ...extracted,
    project: escapedProject,
  };
}

export function extractRepositoryUrl({
  organisationUrl,
  project,
  repository,
}: {
  organisationUrl: string;
  project: string;
  repository: string;
}): AzureDevOpsRepositoryUrl {
  const extracted = extractProjectUrl({ organisationUrl, project });
  const { organisation, 'virtual-directory': virtualDirectory, project: escapedProject } = extracted;

  const escapedRepository = encodeURI(repository); // encode special characters like spaces
  const repoSlug = `${virtualDirectory ? `${virtualDirectory}/` : ''}${organisation}/${escapedProject}/_git/${escapedRepository}`;

  return {
    ...extracted,
    repository: escapedRepository,
    'repository-slug': repoSlug,
  };
}

/**
 * Extract organisation name from organisation URL
 *
 * @param organisationUrl
 *
 * @returns organisation name
 */
function extractOrganisation(organisationUrl: string): string {
  const url = new URL(organisationUrl);
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

  throw new Error(`Error parsing organisation from organisation url: '${organisationUrl}'.`);
}

/**
 * Extract virtual directory from organisation URL
 *
 * Virtual Directories are sometimes used in on-premises
 * @param organisationUrl
 *
 * @returns virtual directory
 *
 * @example URLs typically are like this:`https://server.domain.com/tfs/x/` and `tfs` is the virtual directory
 */
function extractVirtualDirectory(organisationUrl: URL) {
  // extract the pathname from the url then split
  // pathname takes the shape '/tfs/x/'
  const path = organisationUrl.pathname.split('/');

  // Virtual Directories are sometimes used in on-premises
  // URLs typically are like this: https://server.domain.com/tfs/x/
  // The pathname extracted looks like this: '/tfs/x/'
  return path.length === 4 ? path[1]! : undefined;
}
