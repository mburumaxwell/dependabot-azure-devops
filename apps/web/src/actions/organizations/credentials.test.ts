import { describe, expect, it } from 'vitest';
import { validateGitHubToken } from './credentials';

describe('validateGitHubToken', () => {
  it('returns invalid for empty token', async () => {
    const result = await validateGitHubToken({ token: '' });
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Token is required');
  });

  describe('real API', async () => {
    it('returns invalid for malformed token', async () => {
      const result = await validateGitHubToken({ token: 'malformed_token' });
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Invalid token. Please check your GitHub personal access token.');
    }, 2000);

    it('works with a real token', async () => {
      // provide a valid token via GITHUB_TOKEN environment variable or replace the placeholder below
      const token = process.env.GITHUB_TOKEN || 'YOUR_GITHUB_TOKEN_HERE';
      if (token === 'YOUR_GITHUB_TOKEN_HERE') {
        console.log('Skipping real API test - set GITHUB_TOKEN environment variable to run this test');
        return;
      }

      const result = await validateGitHubToken({ token });
      expect(result.valid).toBe(true);
      expect(result.message).toBeUndefined();
    }, 2000);
  });
});
