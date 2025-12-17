export const API_VERSION = '5.0'; // this is the same version used by dependabot-core
export const API_VERSION_PREVIEW = '5.0-preview';

/** Returned when no user is authenticated */
export const ANONYMOUS_USER_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

/**
 * Pull request property names used to store metadata about the pull request.
 * https://learn.microsoft.com/en-us/rest/api/azure/devops/git/pull-request-properties
 */
export const PR_PROPERTY_MICROSOFT_GIT_SOURCE_REF_NAME = 'Microsoft.Git.PullRequest.SourceRefName';
export const PR_PROPERTY_DEPENDABOT_PACKAGE_MANAGER = 'Dependabot.PackageManager';
export const PR_PROPERTY_DEPENDABOT_DEPENDENCIES = 'Dependabot.Dependencies';

export const PR_DESCRIPTION_MAX_LENGTH = 4_000;
