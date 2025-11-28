import type { Octokit } from 'octokit';
import * as semver from 'semver';
import { z } from 'zod';

import { logger } from '@/logger';
import { createGitHubClient } from './client';

// we use nullish() because it does optional() and allows the value to be set to null

const GHSA_SECURITY_VULNERABILITIES_QUERY = `
  query($ecosystem: SecurityAdvisoryEcosystem, $package: String) {
    securityVulnerabilities(first: 100, ecosystem: $ecosystem, package: $package) {
      nodes {
        advisory {
          identifiers {
            type,
            value
          },
          severity,
          summary,
          description,
          references {
            url
          }
          cvssSeverities {
            cvssV3 {
              score
              vectorString
            }
            cvssV4 {
              score
              vectorString
            }
          }
          epss {
            percentage
            percentile
          }
          cwes (first: 100) {
            nodes {
              cweId
              name
              description
            }
          }
          publishedAt
          updatedAt
          withdrawnAt
          permalink
        }
        vulnerableVersionRange
        firstPatchedVersion {
          identifier
        }
      }
    }
  }
`;

export const PackageEcosystemSchema = z.enum([
  // https://docs.github.com/en/enterprise-cloud@latest/graphql/reference/enums#securityadvisoryecosystem
  'COMPOSER',
  'ERLANG',
  'GO',
  'ACTIONS',
  'MAVEN',
  'NPM',
  'NUGET',
  'PIP',
  'PUB',
  'RUBYGEMS',
  'RUST',
  'SWIFT',
]);
export type PackageEcosystem = z.infer<typeof PackageEcosystemSchema>;

export const PackageSchema = z.object({
  name: z.string(),
  version: z.string().nullish(),
});
export type Package = z.infer<typeof PackageSchema>;

export const SecurityAdvisoryIdentifierSchema = z.enum(['CVE', 'GHSA']);
export type SecurityAdvisoryIdentifierType = z.infer<typeof SecurityAdvisoryIdentifierSchema>;

export const SecurityAdvisorySeveritySchema = z.enum(['LOW', 'MODERATE', 'HIGH', 'CRITICAL']);
export type SecurityAdvisorySeverity = z.infer<typeof SecurityAdvisorySeveritySchema>;

const CweSchema = z.object({
  cweId: z.string(),
  name: z.string(),
  description: z.string(),
});

const CvssSchema = z.object({
  score: z.number(),
  vectorString: z.string().nullish(),
});
type Cvss = z.infer<typeof CvssSchema>;

export const SecurityAdvisorySchema = z.object({
  identifiers: z
    .object({
      type: z.union([SecurityAdvisoryIdentifierSchema, z.string()]),
      value: z.string(),
    })
    .array(),
  severity: SecurityAdvisorySeveritySchema.nullish(),
  summary: z.string(),
  description: z.string().nullish(),
  references: z.object({ url: z.string() }).array().nullish(),
  cvss: CvssSchema.nullish(),
  epss: z
    .object({
      percentage: z.number().nullish(),
      percentile: z.number().nullish(),
    })
    .nullish(),
  cwes: CweSchema.array().nullish(),
  publishedAt: z.string().nullish(),
  updatedAt: z.string().nullish(),
  withdrawnAt: z.string().nullish(),
  permalink: z.string().nullish(),
});
export type SecurityAdvisory = z.infer<typeof SecurityAdvisorySchema>;

const FirstPatchedVersionSchema = z.object({ identifier: z.string() });
export type FirstPatchedVersion = z.infer<typeof FirstPatchedVersionSchema>;

export const SecurityVulnerabilitySchema = z.object({
  package: PackageSchema,
  advisory: SecurityAdvisorySchema,
  vulnerableVersionRange: z.string(),
  firstPatchedVersion: FirstPatchedVersionSchema.nullish(),
});
export type SecurityVulnerability = z.infer<typeof SecurityVulnerabilitySchema>;

const CvssSeveritiesSchema = z.object({
  cvssV3: CvssSchema.nullish(),
  cvssV4: CvssSchema.nullish(),
});
type CvssSeverities = z.infer<typeof CvssSeveritiesSchema>;

const GitHubSecurityVulnerabilitiesResponseSchema = z.object({
  securityVulnerabilities: z.object({
    nodes: z
      .object({
        advisory: SecurityAdvisorySchema.omit({ cvss: true /* incoming is cvssSeverities */ }).extend({
          cvssSeverities: CvssSeveritiesSchema,
          cwes: z.object({ nodes: CweSchema.array() }).nullish(),
        }),
        firstPatchedVersion: FirstPatchedVersionSchema.nullish(),
        vulnerableVersionRange: z.string(),
      })
      .array(),
  }),
});
type GitHubSecurityVulnerabilitiesResponse = z.infer<typeof GitHubSecurityVulnerabilitiesResponseSchema>;

export function getGhsaPackageEcosystemFromDependabotPackageManager(
  dependabotPackageManager: string,
): PackageEcosystem {
  switch (dependabotPackageManager) {
    case 'composer':
      return 'COMPOSER';
    case 'elm':
      return 'ERLANG';
    case 'github_actions':
      return 'ACTIONS';
    case 'go_modules':
      return 'GO';
    case 'maven':
      return 'MAVEN';
    case 'npm_and_yarn':
      return 'NPM';
    case 'nuget':
      return 'NUGET';
    case 'pip':
      return 'PIP';
    case 'pub':
      return 'PUB';
    case 'bundler':
      return 'RUBYGEMS';
    case 'cargo':
      return 'RUST';
    case 'swift':
      return 'SWIFT';
    default:
      throw new Error(`Unknown dependabot package manager: ${dependabotPackageManager}`);
  }
}

/**
 * GitHub Security Advisory client
 */
export class GitHubSecurityAdvisoryClient {
  private readonly octokit: Octokit;

  /**
   * @param token GitHub personal access token with access to the GHSA API
   */
  constructor(token: string) {
    this.octokit = createGitHubClient({ token });
  }

  /**
   * Get the list of security vulnerabilities for a given package ecosystem and list of packages
   * @param packageEcosystem
   * @param packages
   */
  public async getSecurityVulnerabilitiesAsync(
    packageEcosystem: PackageEcosystem,
    packages: Package[],
  ): Promise<SecurityVulnerability[]> {
    // GitHub API doesn't support querying multiple package at once, so we need to make a request for each package individually.
    // To speed up the process, we can make the requests in parallel, 100 at a time. We batch the requests to avoid hitting the rate limit too quickly.
    // https://docs.github.com/en/graphql/overview/rate-limits-and-node-limits-for-the-graphql-api
    const securityVulnerabilities = await this.batchGraphQueryAsync<Package, SecurityVulnerability>(
      100,
      packages,
      async (pkg) => {
        const variables = {
          ecosystem: packageEcosystem,
          package: pkg.name,
        };

        function pickCvss(value: CvssSeverities): Cvss | undefined {
          // Pick the one with a non-zero score
          if (value.cvssV4 && value.cvssV4.score > 0) return value.cvssV4;
          if (value.cvssV3 && value.cvssV3.score > 0) return value.cvssV3;
        }

        try {
          const response = await this.octokit.graphql<GitHubSecurityVulnerabilitiesResponse>(
            GHSA_SECURITY_VULNERABILITIES_QUERY,
            variables,
          );
          const parsed = GitHubSecurityVulnerabilitiesResponseSchema.parse(response);
          const vulnerabilities = parsed.securityVulnerabilities.nodes;
          return (
            vulnerabilities
              ?.filter((v) => v.advisory != null)
              ?.map(
                (v) =>
                  ({
                    ...v,
                    package: pkg,
                    advisory: {
                      ...v.advisory,
                      cwes: v.advisory.cwes?.nodes,
                      cvss: pickCvss(v.advisory.cvssSeverities),
                    },
                  }) satisfies SecurityVulnerability,
              ) || []
          );
        } catch (error) {
          logger.warn(`GHSA GraphQL request failed for package ${pkg.name}: ${error}. Continuing with other packages.`);
          return [];
        }
      },
    );

    return securityVulnerabilities;
  }

  /**
   * Batch requests in parallel to speed up the process when we are forced to do a N+1 query
   * @param batchSize
   * @param items
   * @param action
   * @returns
   */
  private async batchGraphQueryAsync<T1, T2>(batchSize: number, items: T1[], action: (item: T1) => Promise<T2[]>) {
    const results: T2[] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      if (batch?.length) {
        try {
          const batchResults = await Promise.all(batch.map(action));
          if (batchResults?.length) {
            results.push(...batchResults.flat());
          }
        } catch (error) {
          logger.warn(`Request batch [${i}-${i + batchSize}] failed; The data may be incomplete. ${error}`);
        }
      }
    }
    return results;
  }
}

export function filterVulnerabilities(securityVulnerabilities: SecurityVulnerability[]): SecurityVulnerability[] {
  // Filter out vulnerabilities that have been withdrawn or that are not relevant the current version of the package
  const affectedVulnerabilities = securityVulnerabilities
    .filter((v) => !v.advisory.withdrawnAt)
    .filter((v) => {
      const pkg = v.package;
      if (!pkg || !pkg.version || !v.vulnerableVersionRange) {
        return false;
      }

      /**
       * The vulnerable version range follows a basic syntax with a few forms:
       *   `= 0.2.0` denotes a single vulnerable version
       *   `<= 1.0.8` denotes a version range up to and including the specified version
       *   `< 0.1.11` denotes a version range up to, but excluding, the specified version
       *   `>= 4.3.0, < 4.3.5` denotes a version range with a known minimum and maximum version
       *   `>= 0.0.1` denotes a version range with a known minimum, but no known maximum
       */
      const versionRangeRequirements = v.vulnerableVersionRange.split(',').map((v) => v.trim());
      return versionRangeRequirements.every((r) => pkg.version && semver.satisfies(pkg.version, r));
    });
  return affectedVulnerabilities;
}
