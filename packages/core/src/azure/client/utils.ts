import * as path from 'node:path';
import { z } from 'zod';

import {
  areEqual,
  type DependabotCreatePullRequest,
  type DependabotExistingGroupPr,
  type DependabotExistingPr,
  DependabotExistingPrDependencySchema,
  type DependabotPersistedPr,
  DependabotPersistedPrSchema,
  type DependabotUpdatePullRequest,
  getDependencyNames,
} from '@/dependabot';
import { PR_PROPERTY_DEPENDABOT_DEPENDENCIES, PR_PROPERTY_DEPENDABOT_PACKAGE_MANAGER } from './constants';
import type { AzdoFileChange, AzdoPrExtractedWithProperties, AzdoVersionControlChangeType } from './types';

export function buildPullRequestProperties(packageManager: string, dependencies: DependabotPersistedPr) {
  return [
    { name: PR_PROPERTY_DEPENDABOT_PACKAGE_MANAGER, value: packageManager },
    { name: PR_PROPERTY_DEPENDABOT_DEPENDENCIES, value: JSON.stringify(dependencies) },
  ];
}

export function parsePullRequestProps(
  pr: AzdoPrExtractedWithProperties,
): DependabotExistingPr | DependabotExistingGroupPr {
  // TODO: remove legacy format support on or after 2026-03-26 (it would be 90 days later)
  const WithLegacySchema = z.union([
    DependabotPersistedPrSchema,
    // legacy format to be removed in the future
    DependabotExistingPrDependencySchema.array(),
  ]);

  const parsed = WithLegacySchema.parse(
    JSON.parse(pr.properties!.find((p) => p.name === PR_PROPERTY_DEPENDABOT_DEPENDENCIES)!.value),
  );
  if (Array.isArray(parsed)) {
    return { 'pr-number': pr.pullRequestId, dependencies: parsed };
  } else {
    return { 'pr-number': pr.pullRequestId, ...parsed };
  }
}

function filterPullRequestsByPackageManager(pr: AzdoPrExtractedWithProperties, packageManager: string) {
  return pr.properties?.find((p) => p.name === PR_PROPERTY_DEPENDABOT_PACKAGE_MANAGER && p.value === packageManager);
}

export function parsePullRequestProperties(
  pullRequests: AzdoPrExtractedWithProperties[],
  packageManager: string,
): (DependabotExistingPr | DependabotExistingGroupPr)[] {
  return pullRequests.filter((pr) => filterPullRequestsByPackageManager(pr, packageManager)).map(parsePullRequestProps);
}

export function getPullRequestForDependencyNames(
  existingPullRequests: AzdoPrExtractedWithProperties[],
  packageManager: string,
  dependencyNames: string[],
  dependencyGroupName?: string | null,
): AzdoPrExtractedWithProperties | undefined {
  return existingPullRequests
    .filter((pr) => filterPullRequestsByPackageManager(pr, packageManager))
    .find((pr) => {
      const parsedPr = parsePullRequestProps(pr);
      const prGroupName = 'dependency-group-name' in parsedPr ? parsedPr['dependency-group-name'] : null;

      // For grouped PRs: match by group name (dependencies can vary)
      if (dependencyGroupName) {
        return prGroupName === dependencyGroupName;
      }

      // For non-grouped PRs: match by exact dependency names
      return !prGroupName && areEqual(getDependencyNames(parsedPr), dependencyNames);
    });
}

export function getPullRequestChangedFiles(data: DependabotCreatePullRequest | DependabotUpdatePullRequest) {
  return data['updated-dependency-files']
    .filter((file) => file.type === 'file')
    .map((file) => {
      let changeType: AzdoVersionControlChangeType = 'none';
      if (file.deleted === true || file.operation === 'delete') {
        changeType = 'delete';
      } else if (file.operation === 'update') {
        changeType = 'edit';
      } else {
        changeType = 'add';
      }
      return {
        changeType: changeType,
        path: path.join(file.directory, file.name),
        content: file.content ?? undefined,
        encoding: file.content_encoding || 'utf-8', // default to 'utf-8' if nullish or empty string
      } satisfies AzdoFileChange;
    });
}
