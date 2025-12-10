import * as path from 'node:path';

import {
  type DependabotClosePullRequest,
  type DependabotCreatePullRequest,
  type DependabotDependency,
  type DependabotExistingGroupPR,
  DependabotExistingGroupPRSchema,
  type DependabotExistingPR,
  DependabotExistingPRSchema,
  type DependabotUpdatePullRequest,
} from '@/dependabot';
import { PR_PROPERTY_DEPENDABOT_DEPENDENCIES, PR_PROPERTY_DEPENDABOT_PACKAGE_MANAGER } from './constants';
import type { AzdoFileChange, AzdoPrExtractedWithProperties, AzdoVersionControlChangeType } from './types';

export function normalizeFilePath(path: string): string {
  // Convert backslashes to forward slashes, convert './' => '/' and ensure the path starts with a forward slash if it doesn't already, this is how DevOps paths are formatted
  return path
    ?.replace(/\\/g, '/')
    ?.replace(/^\.\//, '/')
    ?.replace(/^([^/])/, '/$1');
}

export function normalizeBranchName(branch: string): string;
export function normalizeBranchName(branch?: string): string | undefined;
export function normalizeBranchName(branch?: string): string | undefined {
  // Strip the 'refs/heads/' prefix from the branch name, if present
  return branch?.replace(/^refs\/heads\//i, '');
}

export const DependenciesPrPropertySchema = DependabotExistingPRSchema.array().or(DependabotExistingGroupPRSchema);

export function buildPullRequestProperties(
  packageManager: string,
  dependencies: DependabotExistingPR[] | DependabotExistingGroupPR,
) {
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
): Record<string, DependabotExistingPR[] | DependabotExistingGroupPR> {
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
          DependenciesPrPropertySchema.parse(
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
          areEqual(getDependencyNames(DependenciesPrPropertySchema.parse(JSON.parse(p.value))), dependencyNames),
      )
    );
  });
}

function getDependencyNames(dependencies: DependabotExistingPR[] | DependabotExistingGroupPR): string[] {
  const deps = Array.isArray(dependencies) ? dependencies : dependencies.dependencies;
  return deps.map((dep) => dep['dependency-name']?.toString());
}

function areEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((name) => b.includes(name));
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

export function getPullRequestCloseReason(data: DependabotClosePullRequest): string | undefined {
  // The first dependency is the "lead" dependency in a multi-dependency update
  const leadDependencyName = data['dependency-names'][0];
  let reason: string | undefined;
  switch (data.reason) {
    case 'dependencies_changed':
      reason = `Looks like the dependencies have changed`;
      break;
    case 'dependency_group_empty':
      reason = `Looks like the dependencies in this group are now empty`;
      break;
    case 'dependency_removed':
      reason = `Looks like ${leadDependencyName} is no longer a dependency`;
      break;
    case 'up_to_date':
      reason = `Looks like ${leadDependencyName} is up-to-date now`;
      break;
    case 'update_no_longer_possible':
      reason = `Looks like ${leadDependencyName} can no longer be updated`;
      break;
  }
  if (reason && reason.length > 0) {
    reason += ', so this is no longer needed.';
  }
  return reason;
}

export function getPullRequestDependenciesPropertyValue(
  data: DependabotCreatePullRequest,
): DependabotExistingPR[] | DependabotExistingGroupPR {
  const dependencies = data.dependencies?.map((dep) => {
    return {
      'dependency-name': dep.name,
      'dependency-version': dep.version,
      directory: dep.directory,
    };
  });
  const dependencyGroupName = data['dependency-group']?.name;
  if (!dependencyGroupName) return dependencies;
  return {
    'dependency-group-name': dependencyGroupName,
    dependencies: dependencies,
  } as DependabotExistingGroupPR;
}

export function getPullRequestDescription(
  packageManager: string,
  body: string | null | undefined,
  dependencies: DependabotDependency[],
): string {
  let header = '';
  const footer = '';

  // Fix up GitHub mentions encoding issues by removing instances of the zero-width space '\u200B' as it does not render correctly in Azure DevOps.
  // https://github.com/dependabot/dependabot-core/issues/9572
  // https://github.com/dependabot/dependabot-core/blob/313fcff149b3126cb78b38d15f018907d729f8cc/common/lib/dependabot/pull_request_creator/message_builder/link_and_mention_sanitizer.rb#L245-L252
  const description = (body || '').replace(new RegExp(decodeURIComponent('%EF%BF%BD%EF%BF%BD%EF%BF%BD'), 'g'), '');

  // If there is exactly one dependency, add a compatibility score badge to the description header.
  // Compatibility scores are intended for single dependency security updates, not group updates.
  // https://docs.github.com/en/github/managing-security-vulnerabilities/about-dependabot-security-updates#about-compatibility-scores
  if (dependencies.length === 1) {
    const compatibilityScoreBadges = dependencies.map((dep) => {
      return `![Dependabot compatibility score](https://dependabot-badges.githubapp.com/badges/compatibility_score?dependency-name=${dep.name}&package-manager=${packageManager}&previous-version=${dep['previous-version']}&new-version=${dep.version})`;
    });
    header += `${compatibilityScoreBadges.join(' ')}\n\n`;
  }

  // Build the full pull request description.
  // The header/footer must not be truncated. If the description is too long, we truncate the body.
  const maxDescriptionLength = 4000;
  const maxDescriptionLengthAfterHeaderAndFooter = maxDescriptionLength - header.length - footer.length;
  return `${header}${description.substring(0, maxDescriptionLengthAfterHeaderAndFooter)}${footer}`;
}
