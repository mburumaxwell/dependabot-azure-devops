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

  it('real API', async () => {
    // provide a valid token via GITHUB_TOKEN environment variable or replace the placeholder below
    const token = process.env.GITHUB_TOKEN || 'YOUR_GITHUB_TOKEN_HERE';
    if (token === 'YOUR_GITHUB_TOKEN_HERE') {
      console.log('Skipping real API test - set GITHUB_TOKEN environment variable to run this test');
      return;
    }

    const client = new GitHubSecurityAdvisoryClient(token);

    // Test with a small package that's likely to have vulnerabilities
    const vulnerabilities = await client.getSecurityVulnerabilitiesAsync('NPM', [
      { name: 'lodash', version: '4.0.0' }, // Old version likely to have known vulnerabilities
    ]);

    console.log('Found vulnerabilities:', vulnerabilities.length);

    // Basic assertions
    expect(vulnerabilities).toBeDefined();
    expect(Array.isArray(vulnerabilities)).toBe(true);
    expect(vulnerabilities.length).toBeGreaterThanOrEqual(7);
    const vuln = vulnerabilities.find((v) => v.advisory.identifiers.find((id) => id.value === 'GHSA-29mw-wpgm-hmr9'));
    expect(vuln).toBeDefined();
    expect(vuln!.advisory.identifiers.find((id) => id.type === 'CVE' && id.value === 'CVE-2020-28500')).toBeDefined();
    expect(vuln!.advisory.permalink).toEqual('https://github.com/advisories/GHSA-29mw-wpgm-hmr9');
    expect(vuln!.advisory.cvss?.score).toEqual(5.3);
  }, 2000);
});
