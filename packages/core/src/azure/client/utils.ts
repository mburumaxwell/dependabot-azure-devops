import * as path from 'node:path';

import {
  areEqual,
  type DependabotCreatePullRequest,
  type DependabotPersistedPr,
  DependabotPersistedPrSchema,
  type DependabotUpdatePullRequest,
  getDependencyNames,
} from '@/dependabot';
import { PR_PROPERTY_DEPENDABOT_DEPENDENCIES, PR_PROPERTY_DEPENDABOT_PACKAGE_MANAGER } from './constants';
import type { AzdoFileChange, AzdoPrExtractedWithProperties, AzdoVersionControlChangeType } from './types';

export function buildPullRequestProperties(packageManager: string, dependencies: DependabotPersistedPr) {
  return [
    {
      name: PR_PROPERTY_DEPENDABOT_PACKAGE_MANAGER,
      value: packageManager,
    },
    {
      name: PR_PROPERTY_DEPENDABOT_DEPENDENCIES,
      value: JSON.stringify(dependencies),
    },
  ];
}

export function parsePullRequestProperties(
  pullRequests: AzdoPrExtractedWithProperties[],
  packageManager: string | null,
): Record<string, DependabotPersistedPr> {
  return Object.fromEntries(
    pullRequests
      .filter((pr) => {
        return pr.properties?.find(
          (p) =>
            p.name === PR_PROPERTY_DEPENDABOT_PACKAGE_MANAGER &&
            (packageManager === null || p.value === packageManager),
        );
      })
      .map((pr) => {
        return [
          pr.pullRequestId,
          DependabotPersistedPrSchema.parse(
            JSON.parse(pr.properties!.find((p) => p.name === PR_PROPERTY_DEPENDABOT_DEPENDENCIES)!.value),
          ),
        ];
      }),
  );
}

export function getPullRequestForDependencyNames(
  existingPullRequests: AzdoPrExtractedWithProperties[],
  packageManager: string,
  dependencyNames: string[],
): AzdoPrExtractedWithProperties | undefined {
  return existingPullRequests.find((pr) => {
    return (
      pr.properties?.find((p) => p.name === PR_PROPERTY_DEPENDABOT_PACKAGE_MANAGER && p.value === packageManager) &&
      pr.properties?.find(
        (p) =>
          p.name === PR_PROPERTY_DEPENDABOT_DEPENDENCIES &&
          areEqual(getDependencyNames(DependabotPersistedPrSchema.parse(JSON.parse(p.value))), dependencyNames),
      )
    );
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
