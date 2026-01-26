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

export type AzureDevOpsRepositoryUrl = AzureDevOpsOrganizationUrl & {
  /**
   * Project ID or Name.
   * This value is not URL-encoded, clients must encode it when constructing URLs.
   */
  project: string;
  /**
   * Repository ID or Name.
   * This value is not URL-encoded, clients must encode it when constructing URLs.
   */
  repository: string;

  /** Slug of the repository e.g. `contoso/prj1/_git/repo1`, `tfs/contoso/prj1/_git/repo1` */
  'repository-slug': string;
};

/**
 * Extract organization details from any Azure DevOps URL.
 * Accepts organization, project, or repository URLs.
 */
export function extractOrganizationUrl({ organizationUrl }: { organizationUrl: string }): AzureDevOpsOrganizationUrl {
  const value = new URL(organizationUrl);
  const protocol = value.protocol.slice(0, -1);
  if (protocol !== 'https' && protocol !== 'http') {
    throw new Error(`Invalid URL protocol: '${protocol}'. Only 'http' and 'https' are supported.`);
  }

  let { hostname } = value;

  // Handle old Visual Studio URLs: contoso.visualstudio.com -> dev.azure.com
  const visualStudioMatch = hostname.match(/^(\S+)\.visualstudio\.com$/i);
  if (visualStudioMatch) {
    hostname = 'dev.azure.com';
  }

  // Parse path segments, ignoring everything after _git if present
  const allSegments = value.pathname.split('/').filter(Boolean);
  const gitIndex = allSegments.indexOf('_git');
  const segments = gitIndex >= 0 ? allSegments.slice(0, gitIndex) : allSegments;

  // Extract organization based on URL structure
  let organization: string;
  let virtualDirectory: string | undefined;

  if (visualStudioMatch) {
    // Visual Studio URL: org is in subdomain
    organization = visualStudioMatch[1]!;
  } else if (segments.length >= 2 && hostname !== 'dev.azure.com') {
    // On-premise with virtual directory: /virtualDir/org/...
    virtualDirectory = segments[0];
    organization = segments[1]!;
  } else if (segments.length >= 1) {
    // Azure DevOps or simple on-premise: /org/...
    organization = segments[0]!;
  } else {
    throw new Error(`Error parsing organization from url: '${organizationUrl}'.`);
  }

  const apiEndpoint = `${protocol}://${hostname}${value.port ? `:${value.port}` : ''}/${virtualDirectory ? `${virtualDirectory}/` : ''}`;

  // Identity API URL for Azure DevOps cloud
  const identityApiUrl =
    hostname === 'dev.azure.com' || hostname.endsWith('.visualstudio.com')
      ? new URL(`https://vssps.dev.azure.com/${organization}/`)
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

export function extractRepositoryUrl(
  options: { repositoryUrl: string } | { organizationUrl: string; project: string; repository: string },
): AzureDevOpsRepositoryUrl {
  let project: string;
  let repository: string;
  let extracted: AzureDevOpsOrganizationUrl;

  if ('repositoryUrl' in options) {
    // Parse full repository URL
    const url = new URL(options.repositoryUrl);
    if (!url.pathname.includes('/_git/')) {
      throw new Error(`Invalid repository URL: '${options.repositoryUrl}'. URL must contain '/_git/'.`);
    }

    // Split path into segments
    const segments = url.pathname.split('/').filter(Boolean);
    const gitIndex = segments.indexOf('_git');
    if (gitIndex === -1 || gitIndex >= segments.length - 1) {
      throw new Error(`Invalid repository URL: '${options.repositoryUrl}'. Repository name must follow '/_git/'.`);
    }

    // Extract project and repository
    project = decodeURIComponent(segments[gitIndex - 1]!);
    repository = decodeURIComponent(segments.slice(gitIndex + 1).join('/'));

    // Build organization URL and extract its details
    const orgSegments = segments.slice(0, gitIndex - 1);
    const orgPath = orgSegments.length > 0 ? `/${orgSegments.join('/')}/` : '/';
    const organizationUrl = `${url.protocol}//${url.host}${orgPath}`;
    extracted = extractOrganizationUrl({ organizationUrl });
  } else {
    // Build from separate components
    project = decodeURIComponent(options.project);
    repository = decodeURIComponent(options.repository);
    extracted = extractOrganizationUrl({ organizationUrl: options.organizationUrl });
  }

  // Build slug - encodeURI preserves forward slashes in repository names
  const virtualDirectory = extracted['virtual-directory'];
  const repoSlug = `${virtualDirectory ? `${virtualDirectory}/` : ''}${extracted.organization}/${encodeURI(project)}/_git/${encodeURI(repository)}`;

  return {
    ...extracted,
    project,
    repository,
    'repository-slug': repoSlug,
  };
}
