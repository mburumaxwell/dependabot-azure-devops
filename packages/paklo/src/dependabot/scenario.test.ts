import { readFile } from 'fs/promises';
import * as yaml from 'js-yaml';
import { describe, expect, it } from 'vitest';

import { DependabotInputSchema } from './scenario';

describe('input', () => {
  it('python-pip', async () => {
    const raw = yaml.load(await readFile('fixtures/jobs/python-pip.yaml', 'utf-8'));
    const input = DependabotInputSchema.parse(raw);

    // parsing is enough to test that we generated the correct job schema
    // but we test a few fields to be sure
    expect(input.job['package-manager']).toEqual('pip');
    expect(input.job['credentials-metadata']).toBeDefined();
    expect(input.credentials[0]!.type).toEqual('git_source');
    expect(input.credentials[0]!.host).toEqual('dev.azure.com');
    expect(input.credentials[0]!.username).toEqual('x-access-token');
    expect(input.credentials[0]!.password).toEqual('01');
  });
});
