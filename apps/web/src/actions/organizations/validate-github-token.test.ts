import { describe, expect, it } from 'vitest';
import { validateGitHubToken } from './validate-github-token';

describe('validateGitHubToken', () => {
  it('returns invalid for empty token', async () => {
    const result = await validateGitHubToken({ token: '' });
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Token is required');
  });

  // when testing the real thing, remove .skip and provide a valid token
  describe.skip('real API (ONLY FOR LOCAL USE)', async () => {
    it('returns invalid for malformed token', async () => {
      const result = await validateGitHubToken({ token: 'malformed_token' });
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Invalid token. Please check your GitHub personal access token.');
    }, 2000);

    const token = 'YOUR_GITHUB_TOKEN_HERE';

    it('works with a real token', async () => {
      const result = await validateGitHubToken({ token });
      expect(result.valid).toBe(true);
      expect(result.message).toBeUndefined();
    }, 2000);
  });
});
