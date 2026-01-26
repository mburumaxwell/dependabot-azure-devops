import { describe, expect, it } from 'vitest';

import { extractOrganizationUrl, extractRepositoryUrl } from './url-parts';

describe('extractOrganizationUrl', () => {
  it('works for old style devops url', () => {
    const url = extractOrganizationUrl({ organizationUrl: 'https://contoso.visualstudio.com/' });
    expect(url.hostname).toBe('dev.azure.com');
    expect(url['api-endpoint']).toBe('https://dev.azure.com/');
    expect(url['identity-api-url']).toEqual(new URL('https://vssps.dev.azure.com/contoso/'));
    expect(url.organization).toBe('contoso');
  });

  it('works for azure devops domain', () => {
    const url = extractOrganizationUrl({ organizationUrl: 'https://dev.azure.com/contoso/' });
    expect(url.hostname).toBe('dev.azure.com');
    expect(url['api-endpoint']).toBe('https://dev.azure.com/');
    expect(url['identity-api-url']).toEqual(new URL('https://vssps.dev.azure.com/contoso/'));
    expect(url.organization).toBe('contoso');
  });

  it('works for on-premise domain', () => {
    const url = extractOrganizationUrl({ organizationUrl: 'https://server.domain.com/tfs/contoso/' });
    expect(url.hostname).toBe('server.domain.com');
    expect(url['api-endpoint']).toBe('https://server.domain.com/tfs/');
    expect(url['identity-api-url']).toEqual(new URL('https://server.domain.com/tfs/contoso/'));
    expect(url.organization).toBe('contoso');
  });

  it('works for on-premise domain with port', () => {
    const url = extractOrganizationUrl({ organizationUrl: 'https://server.domain.com:8081/tfs/contoso/' });
    expect(url.hostname).toBe('server.domain.com');
    expect(url['api-endpoint']).toBe('https://server.domain.com:8081/tfs/');
    expect(url.organization).toBe('contoso');
  });

  it('works for localhost', () => {
    const url = extractOrganizationUrl({ organizationUrl: 'http://localhost:8080/contoso/' });
    expect(url.hostname).toBe('localhost');
    expect(url['api-endpoint']).toBe('http://localhost:8080/');
    expect(url.organization).toBe('contoso');
  });

  it('works for organization url with virtual directory', () => {
    const url = extractOrganizationUrl({ organizationUrl: 'https://server.domain.com/virtualDir/contoso/' });
    expect(url.hostname).toBe('server.domain.com');
    expect(url['api-endpoint']).toBe('https://server.domain.com/virtualDir/');
    expect(url.organization).toBe('contoso');
    expect(url['virtual-directory']).toBe('virtualDir');
  });

  it('works for localhost with virtual directory', () => {
    const url = extractOrganizationUrl({ organizationUrl: 'http://localhost:8080/virtualDir/contoso/' });
    expect(url.hostname).toBe('localhost');
    expect(url['api-endpoint']).toBe('http://localhost:8080/virtualDir/');
    expect(url.organization).toBe('contoso');
    expect(url['virtual-directory']).toBe('virtualDir');
  });

  it('throws for invalid url', () => {
    expect(() => extractOrganizationUrl({ organizationUrl: 'https://dev.azure.com/' })).toThrow(
      "Error parsing organization from url: 'https://dev.azure.com/'.",
    );
  });

  it('throws for invalid protocol', () => {
    expect(() => extractOrganizationUrl({ organizationUrl: 'ftp://dev.azure.com/contoso/' })).toThrow(
      "Invalid URL protocol: 'ftp'. Only 'http' and 'https' are supported.",
    );
  });
});

describe('extractRepositoryUrl', () => {
  it('works for old style devops url', () => {
    const url = extractRepositoryUrl({
      organizationUrl: 'https://contoso.visualstudio.com/',
      project: 'prj1',
      repository: 'repo1',
    });
    expect(url.hostname).toBe('dev.azure.com');
    expect(url['api-endpoint']).toBe('https://dev.azure.com/');
    expect(url['identity-api-url']).toEqual(new URL('https://vssps.dev.azure.com/contoso/'));
    expect(url.project).toBe('prj1');
    expect(url.repository).toBe('repo1');
    expect(url['repository-slug']).toBe('contoso/prj1/_git/repo1');
  });

  it('works for azure devops domain', () => {
    const url = extractRepositoryUrl({
      organizationUrl: 'https://dev.azure.com/contoso/',
      project: 'prj1',
      repository: 'repo1',
    });
    expect(url.hostname).toBe('dev.azure.com');
    expect(url['api-endpoint']).toBe('https://dev.azure.com/');
    expect(url['identity-api-url']).toEqual(new URL('https://vssps.dev.azure.com/contoso/'));
    expect(url.project).toBe('prj1');
    expect(url.repository).toBe('repo1');
    expect(url['repository-slug']).toBe('contoso/prj1/_git/repo1');
  });

  it('works for on-premise domain', () => {
    const url = extractRepositoryUrl({
      organizationUrl: 'https://server.domain.com/tfs/contoso/',
      project: 'prj1',
      repository: 'repo1',
    });
    expect(url.hostname).toBe('server.domain.com');
    expect(url['api-endpoint']).toBe('https://server.domain.com/tfs/');
    expect(url['identity-api-url']).toEqual(new URL('https://server.domain.com/tfs/contoso/'));
    expect(url.project).toBe('prj1');
    expect(url.repository).toBe('repo1');
    expect(url['repository-slug']).toBe('tfs/contoso/prj1/_git/repo1');
  });

  it('works for on-premise domain with port', () => {
    const url = extractRepositoryUrl({
      organizationUrl: 'https://server.domain.com:8081/tfs/contoso/',
      project: 'prj1',
      repository: 'repo1',
    });
    expect(url.hostname).toBe('server.domain.com');
    expect(url['api-endpoint']).toBe('https://server.domain.com:8081/tfs/');
    expect(url.project).toBe('prj1');
    expect(url.repository).toBe('repo1');
    expect(url['repository-slug']).toBe('tfs/contoso/prj1/_git/repo1');
  });

  it('works for localhost', () => {
    const url = extractRepositoryUrl({
      organizationUrl: 'http://localhost:8080/contoso/',
      project: 'prj1',
      repository: 'repo1',
    });
    expect(url.hostname).toBe('localhost');
    expect(url['api-endpoint']).toBe('http://localhost:8080/');
    expect(url.project).toBe('prj1');
    expect(url.repository).toBe('repo1');
    expect(url['repository-slug']).toBe('contoso/prj1/_git/repo1');
  });

  it('works for project or repository with spaces', () => {
    const url = extractRepositoryUrl({
      organizationUrl: 'https://dev.azure.com/contoso/',
      project: 'prj 1',
      repository: 'repo 1',
    });
    expect(url.hostname).toBe('dev.azure.com');
    expect(url['api-endpoint']).toBe('https://dev.azure.com/');
    expect(url.project).toBe('prj 1'); // Stored raw for client methods to encode
    expect(url.repository).toBe('repo 1'); // Stored raw for client methods to encode
    expect(url['repository-slug']).toBe('contoso/prj%201/_git/repo%201'); // Slug is encoded for display
  });

  it('handles already-encoded project and repository names to prevent double-encoding', () => {
    const url = extractRepositoryUrl({
      organizationUrl: 'https://dev.azure.com/contoso/',
      project: 'Markt%20-%20Project', // already encoded input
      repository: 'repo%201', // already encoded input
    });
    expect(url.hostname).toBe('dev.azure.com');
    expect(url['api-endpoint']).toBe('https://dev.azure.com/');
    expect(url.project).toBe('Markt - Project'); // Decoded to raw value
    expect(url.repository).toBe('repo 1'); // Decoded to raw value
    expect(url['repository-slug']).toBe('contoso/Markt%20-%20Project/_git/repo%201'); // Slug re-encoded
  });
});

describe('extractRepositoryUrl with repositoryUrl parameter', () => {
  it('works for azure devops cloud url', () => {
    const url = extractRepositoryUrl({
      repositoryUrl: 'https://dev.azure.com/contoso/prj1/_git/repo1',
    });
    expect(url.hostname).toBe('dev.azure.com');
    expect(url['api-endpoint']).toBe('https://dev.azure.com/');
    expect(url['identity-api-url']).toEqual(new URL('https://vssps.dev.azure.com/contoso/'));
    expect(url.organization).toBe('contoso');
    expect(url.project).toBe('prj1');
    expect(url.repository).toBe('repo1');
    expect(url['repository-slug']).toBe('contoso/prj1/_git/repo1');
  });

  it('works for old style visualstudio.com url', () => {
    const url = extractRepositoryUrl({
      repositoryUrl: 'https://contoso.visualstudio.com/prj1/_git/repo1',
    });
    expect(url.hostname).toBe('dev.azure.com');
    expect(url['api-endpoint']).toBe('https://dev.azure.com/');
    expect(url['identity-api-url']).toEqual(new URL('https://vssps.dev.azure.com/contoso/'));
    expect(url.organization).toBe('contoso');
    expect(url.project).toBe('prj1');
    expect(url.repository).toBe('repo1');
    expect(url['repository-slug']).toBe('contoso/prj1/_git/repo1');
  });

  it('works for on-premise url with virtual directory', () => {
    const url = extractRepositoryUrl({
      repositoryUrl: 'https://server.domain.com/tfs/contoso/prj1/_git/repo1',
    });
    expect(url.hostname).toBe('server.domain.com');
    expect(url['api-endpoint']).toBe('https://server.domain.com/tfs/');
    expect(url['identity-api-url']).toEqual(new URL('https://server.domain.com/tfs/contoso/'));
    expect(url.organization).toBe('contoso');
    expect(url.project).toBe('prj1');
    expect(url.repository).toBe('repo1');
    expect(url['repository-slug']).toBe('tfs/contoso/prj1/_git/repo1');
    expect(url['virtual-directory']).toBe('tfs');
  });

  it('works for on-premise url with port', () => {
    const url = extractRepositoryUrl({
      repositoryUrl: 'https://server.domain.com:8081/tfs/contoso/prj1/_git/repo1',
    });
    expect(url.hostname).toBe('server.domain.com');
    expect(url['api-endpoint']).toBe('https://server.domain.com:8081/tfs/');
    expect(url.organization).toBe('contoso');
    expect(url.project).toBe('prj1');
    expect(url.repository).toBe('repo1');
    expect(url['repository-slug']).toBe('tfs/contoso/prj1/_git/repo1');
    expect(url['virtual-directory']).toBe('tfs');
  });

  it('works for localhost', () => {
    const url = extractRepositoryUrl({
      repositoryUrl: 'http://localhost:8080/contoso/prj1/_git/repo1',
    });
    expect(url.hostname).toBe('localhost');
    expect(url['api-endpoint']).toBe('http://localhost:8080/');
    expect(url.organization).toBe('contoso');
    expect(url.project).toBe('prj1');
    expect(url.repository).toBe('repo1');
    expect(url['repository-slug']).toBe('contoso/prj1/_git/repo1');
  });

  it('works for repository url with spaces', () => {
    const url = extractRepositoryUrl({
      repositoryUrl: 'https://dev.azure.com/contoso/prj%201/_git/repo%201',
    });
    expect(url.hostname).toBe('dev.azure.com');
    expect(url['api-endpoint']).toBe('https://dev.azure.com/');
    expect(url.organization).toBe('contoso');
    expect(url.project).toBe('prj 1');
    expect(url.repository).toBe('repo 1');
    expect(url['repository-slug']).toBe('contoso/prj%201/_git/repo%201');
  });

  it('works for repository with forward slashes in name', () => {
    const url = extractRepositoryUrl({
      repositoryUrl: 'https://dev.azure.com/contoso/prj1/_git/team/repo1',
    });
    expect(url.hostname).toBe('dev.azure.com');
    expect(url['api-endpoint']).toBe('https://dev.azure.com/');
    expect(url.organization).toBe('contoso');
    expect(url.project).toBe('prj1');
    expect(url.repository).toBe('team/repo1');
    expect(url['repository-slug']).toBe('contoso/prj1/_git/team/repo1');
  });

  it('works for localhost with virtual directory', () => {
    const url = extractRepositoryUrl({
      repositoryUrl: 'http://localhost:8080/tfs/contoso/prj1/_git/repo1',
    });
    expect(url.hostname).toBe('localhost');
    expect(url['api-endpoint']).toBe('http://localhost:8080/tfs/');
    expect(url.organization).toBe('contoso');
    expect(url.project).toBe('prj1');
    expect(url.repository).toBe('repo1');
    expect(url['repository-slug']).toBe('tfs/contoso/prj1/_git/repo1');
    expect(url['virtual-directory']).toBe('tfs');
  });

  it('works with query parameters in url', () => {
    const url = extractRepositoryUrl({
      repositoryUrl: 'https://dev.azure.com/contoso/prj1/_git/repo1?version=GBmain',
    });
    expect(url.hostname).toBe('dev.azure.com');
    expect(url.organization).toBe('contoso');
    expect(url.project).toBe('prj1');
    expect(url.repository).toBe('repo1');
  });

  it('works with hash fragment in url', () => {
    const url = extractRepositoryUrl({
      repositoryUrl: 'https://dev.azure.com/contoso/prj1/_git/repo1#path=/README.md',
    });
    expect(url.hostname).toBe('dev.azure.com');
    expect(url.organization).toBe('contoso');
    expect(url.project).toBe('prj1');
    expect(url.repository).toBe('repo1');
  });

  it('throws when _git is missing', () => {
    expect(() =>
      extractRepositoryUrl({
        repositoryUrl: 'https://dev.azure.com/contoso/prj1/repo1',
      }),
    ).toThrow("Invalid repository URL: 'https://dev.azure.com/contoso/prj1/repo1'. URL must contain '/_git/'.");
  });

  it('throws when repository name is missing after _git', () => {
    expect(() =>
      extractRepositoryUrl({
        repositoryUrl: 'https://dev.azure.com/contoso/prj1/_git/',
      }),
    ).toThrow(
      "Invalid repository URL: 'https://dev.azure.com/contoso/prj1/_git/'. Repository name must follow '/_git/'.",
    );
  });

  it('throws when repository name is missing after _git without trailing slash', () => {
    expect(() =>
      extractRepositoryUrl({
        repositoryUrl: 'https://dev.azure.com/contoso/prj1/_git',
      }),
    ).toThrow("Invalid repository URL: 'https://dev.azure.com/contoso/prj1/_git'. URL must contain '/_git/'.");
  });

  it('works for nested repository names', () => {
    const url = extractRepositoryUrl({
      repositoryUrl: 'https://dev.azure.com/contoso/prj1/_git/team/sub/repo1',
    });
    expect(url.project).toBe('prj1');
    expect(url.repository).toBe('team/sub/repo1');
    expect(url['repository-slug']).toBe('contoso/prj1/_git/team/sub/repo1');
  });
});
