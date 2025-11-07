'use server';

import { createGitHubClient } from '@paklo/core/github';
import { RequestError } from 'octokit';

export async function validateGitHubToken({ token }: { token: string }): Promise<{ valid: boolean; message?: string }> {
  if (!token || token.trim().length === 0) {
    return { valid: false, message: 'Token is required' };
  }

  try {
    const octokit = createGitHubClient({ token });

    // Ensure the token works by fetching the authenticated user's information
    await octokit.rest.users.getAuthenticated();

    // Check if the token has the required 'repo' scope
    try {
      await octokit.rest.repos.listForAuthenticatedUser({
        per_page: 1,
        type: 'all',
      });
    } catch (error) {
      // If we can get user info but not repos, the token might not have repo scope
      if (error instanceof Error && error.message.includes('403')) {
        return {
          valid: false,
          message:
            'Token is valid but missing required "repo" scope. Please ensure your token has repository access permissions.',
        };
      }
      throw error;
    }
  } catch (error) {
    if (error instanceof RequestError) {
      if (error.status === 401) {
        return { valid: false, message: 'Invalid token. Please check your GitHub personal access token.' };
      }
      if (error.status === 403) {
        return {
          valid: false,
          message: 'Token has insufficient permissions. Please ensure it has the required scopes.',
        };
      }
      if (error.status === 429) {
        return { valid: false, message: 'Rate limit exceeded. Please try again later.' };
      }

      return { valid: false, message: `GitHub API error: ${error.message} (status: ${error.status})` };
    }

    return { valid: false, message: `Token validation failed: ${(error as Error).message}` };
  }

  return { valid: true };
}
