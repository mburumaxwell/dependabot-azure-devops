import { Octokit } from 'octokit';

/**
 * Creates an authenticated GitHub API client using Octokit.
 *
 * @param token - GitHub personal access token or fine-grained token with appropriate permissions
 * @returns Configured Octokit instance ready for API calls
 */
export function createGitHubClient({ token }: { token: string }): Octokit {
  return new Octokit({
    auth: token,
    // could add retry here perhaps?
  });
}
