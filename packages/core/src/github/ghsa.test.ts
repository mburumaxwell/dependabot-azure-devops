import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

import { GitHubSecurityAdvisoryClient, SecurityVulnerabilitySchema } from './ghsa';

describe('SecurityVulnerabilitySchema', () => {
  it('works for sample', async () => {
    const fileContents = await readFile('../../advisories-example.json', 'utf-8');
    const privateVulnerabilities = await SecurityVulnerabilitySchema.array().parseAsync(JSON.parse(fileContents));
    expect(privateVulnerabilities).toBeDefined();
    expect(privateVulnerabilities.length).toBe(1);

    const value = privateVulnerabilities[0]!;
    expect(value.package).toStrictEqual({ name: 'Contoso.Utils' });
    expect(value.advisory).toBeDefined();
    expect(value.vulnerableVersionRange).toBe('< 3.0.1');
    expect(value.firstPatchedVersion).toStrictEqual({ identifier: '3.0.1' });
  });

  // when testing the real thing, remove .skip and provide a valid token
  it.skip('real API (ONLY FOR LOCAL USE)', async () => {
    const client = new GitHubSecurityAdvisoryClient('YOUR_GITHUB_TOKEN_HERE');

    // Test with a small package that's likely to have vulnerabilities
    const vulnerabilities = await client.getSecurityVulnerabilitiesAsync('NPM', [
      { name: 'lodash', version: '4.0.0' }, // Old version likely to have known vulnerabilities
    ]);

    console.log('Found vulnerabilities:', vulnerabilities.length);
    if (vulnerabilities.length > 0) {
      console.log('First vulnerability:', vulnerabilities[0]);
    }

    // Basic assertions
    expect(vulnerabilities).toBeDefined();
    expect(Array.isArray(vulnerabilities)).toBe(true);
    expect(vulnerabilities.length).toBeGreaterThan(1);
    expect(vulnerabilities[0]!.advisory.permalink).toEqual('https://github.com/advisories/GHSA-29mw-wpgm-hmr9');
  }, 2000);
});
