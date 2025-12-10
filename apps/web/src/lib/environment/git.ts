/**
 * Retrieves the name of the current Git branch from the environment variables or from Git itself.
 * The priority order for retrieving the branch name is as follows:
 * 1. `process.env.DEPLOY_GIT_COMMIT_REF`
 * 2. `process.env.VERCEL_GIT_COMMIT_REF`
 * 4. Retrieve the branch name from Git using the `getBranchFromGit` function.
 * @returns The name of the current Git branch, or undefined if it cannot be determined.
 */
export function getBranch(): string | undefined {
  return process.env.DEPLOY_GIT_COMMIT_REF || process.env.VERCEL_GIT_COMMIT_REF || getBranchFromGit();
}

/**
 * Retrieves the Git SHA (commit hash) from the environment variables or from Git itself.
 * The priority order for retrieving the Git SHA is as follows:
 * 1. `process.env.DEPLOY_GIT_COMMIT_SHA`
 * 2. `process.env.VERCEL_GIT_COMMIT_SHA`
 * 4. Retrieve the SHA from Git using the `getShaFromGit` function.
 * @returns The Git SHA (commit hash) if available, otherwise `undefined`.
 */
export function getSha(): string | undefined {
  return process?.env.DEPLOY_GIT_COMMIT_SHA || process?.env.VERCEL_GIT_COMMIT_SHA || getShaFromGit();
}

/**
 * Retrieves the SHA (commit hash) from the Git repository.
 * @returns The SHA (commit hash) as a string, or undefined if it cannot be retrieved.
 */
function getShaFromGit(): string | undefined {
  try {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
      const { execSync } = require('node:child_process');
      return execSync('git rev-parse HEAD').toString().trim();
    }
  } catch {
    return undefined;
  }
}

/**
 * Retrieves the current branch name from Git.
 * @returns The name of the current branch, or 'unknown' if an error occurs.
 */
function getBranchFromGit(): string | undefined {
  try {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
      const { execSync } = require('node:child_process');
      return execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
    }
  } catch {
    return undefined;
  }
}
