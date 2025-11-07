'use server';

import { createGitHubClient } from '@paklo/core/github';

export async function validateGitHubToken({ token }: { token: string }): Promise<{ valid: boolean; message?: string }> {
  if (!token || token.trim().length === 0) {
    return { valid: false, message: 'Token is required' };
  }

  try {
    const octokit = createGitHubClient({ token });

    // Test the token by fetching the authenticated user's information
    const { status } = await octokit.rest.users.getAuthenticated();
    if (status < 200 || status >= 300) {
      return { valid: false, message: 'Unknown error occurred while validating the token.' };
    }

    // Check if the token has the required 'repo' scope
    // We can infer this by trying to access a repository-specific endpoint
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
    }
  } catch (error) {
    if (error instanceof Error) {
      // Check for common error scenarios
      if (error.message.includes('401') || error.message.includes('Bad credentials')) {
        return { valid: false, message: 'Invalid token. Please check your GitHub personal access token.' };
      }
      if (error.message.includes('403')) {
        return {
          valid: false,
          message: 'Token has insufficient permissions. Please ensure it has the required scopes.',
        };
      }
      if (error.message.includes('rate limit')) {
        return { valid: false, message: 'Rate limit exceeded. Please try again later.' };
      }
      return { valid: false, message: `Token validation failed: ${error.message}` };
    }

    return { valid: false, message: 'An unexpected error occurred while validating the token.' };
  }

  return { valid: true };
}
