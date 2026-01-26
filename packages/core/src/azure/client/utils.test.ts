import { describe, expect, it } from 'vitest';

import { type DependabotCreatePullRequest, DependabotPersistedPrSchema, getPersistedPr } from '@/dependabot';
import { PR_PROPERTY_DEPENDABOT_DEPENDENCIES, PR_PROPERTY_DEPENDABOT_PACKAGE_MANAGER } from './constants';
import type { AzdoPrExtractedWithProperties } from './types';
import {
  buildPullRequestProperties,
  getPullRequestForDependencyNames,
  parsePullRequestProperties,
  parsePullRequestProps,
} from './utils';

describe('parsePullRequestProps', () => {
  it('works for single dependency', () => {
    const pr: AzdoPrExtractedWithProperties = {
      pullRequestId: 123,
      properties: [
        { name: PR_PROPERTY_DEPENDABOT_PACKAGE_MANAGER, value: 'npm' },
        {
          name: PR_PROPERTY_DEPENDABOT_DEPENDENCIES,
          value: JSON.stringify({
            dependencies: [{ 'dependency-name': 'lodash', 'dependency-version': '4.17.21', directory: '/' }],
          }),
        },
      ],
    };

    const result = parsePullRequestProps(pr);
    const expected = {
      'pr-number': 123,
      dependencies: [{ 'dependency-name': 'lodash', 'dependency-version': '4.17.21', directory: '/' }],
    };

    // Validate against the schema
    DependabotPersistedPrSchema.parse(result);

    expect(result).toEqual(expected);
  });

  it('works for group', () => {
    const pr: AzdoPrExtractedWithProperties = {
      pullRequestId: 123,
      properties: [
        { name: PR_PROPERTY_DEPENDABOT_PACKAGE_MANAGER, value: 'npm' },
        {
          name: PR_PROPERTY_DEPENDABOT_DEPENDENCIES,
          value: JSON.stringify({
            'dependency-group-name': 'group-1',
            dependencies: [
              { 'dependency-name': 'lodash', 'dependency-version': '4.17.21', directory: '/' },
              { 'dependency-name': 'express', 'dependency-version': '4.17.1', directory: '/' },
            ],
          }),
        },
      ],
    };

    const result = parsePullRequestProps(pr);
    const expected = {
      'pr-number': 123,
      'dependency-group-name': 'group-1',
      dependencies: [
        { 'dependency-name': 'lodash', 'dependency-version': '4.17.21', directory: '/' },
        { 'dependency-name': 'express', 'dependency-version': '4.17.1', directory: '/' },
      ],
    };

    // Validate against the schema
    DependabotPersistedPrSchema.parse(result);

    expect(result).toEqual(expected);
  });

  it('works for single dependency legacy format', () => {
    const pr: AzdoPrExtractedWithProperties = {
      pullRequestId: 123,
      properties: [
        { name: PR_PROPERTY_DEPENDABOT_PACKAGE_MANAGER, value: 'npm' },
        {
          name: PR_PROPERTY_DEPENDABOT_DEPENDENCIES,
          value: JSON.stringify([{ 'dependency-name': 'lodash', 'dependency-version': '4.17.21', directory: '/' }]),
        },
      ],
    };

    const result = parsePullRequestProps(pr);
    const expected = {
      'pr-number': 123,
      dependencies: [{ 'dependency-name': 'lodash', 'dependency-version': '4.17.21', directory: '/' }],
    };

    // Validate against the schema
    DependabotPersistedPrSchema.parse(result);

    expect(result).toEqual(expected);
  });

  it('works for group legacy format', () => {
    const pr: AzdoPrExtractedWithProperties = {
      pullRequestId: 123,
      properties: [
        { name: PR_PROPERTY_DEPENDABOT_PACKAGE_MANAGER, value: 'npm' },
        {
          name: PR_PROPERTY_DEPENDABOT_DEPENDENCIES,
          value: JSON.stringify({
            'dependency-group-name': 'group-1',
            dependencies: [
              { 'dependency-name': 'lodash', 'dependency-version': '4.17.21', directory: '/' },
              { 'dependency-name': 'express', 'dependency-version': '4.17.1', directory: '/' },
            ],
          }),
        },
      ],
    };

    const result = parsePullRequestProps(pr);
    const expected = {
      'pr-number': 123,
      'dependency-group-name': 'group-1',
      dependencies: [
        { 'dependency-name': 'lodash', 'dependency-version': '4.17.21', directory: '/' },
        { 'dependency-name': 'express', 'dependency-version': '4.17.1', directory: '/' },
      ],
    };

    // Validate against the schema
    DependabotPersistedPrSchema.parse(result);

    expect(result).toEqual(expected);
  });
});

describe('parsePullRequestProperties', () => {
  it('filters by package manager and returns array of parsed PRs', () => {
    const prs: AzdoPrExtractedWithProperties[] = [
      {
        pullRequestId: 1,
        properties: [
          { name: PR_PROPERTY_DEPENDABOT_PACKAGE_MANAGER, value: 'npm_and_yarn' },
          {
            name: PR_PROPERTY_DEPENDABOT_DEPENDENCIES,
            value: JSON.stringify({ dependencies: [{ 'dependency-name': 'lodash' }] }),
          },
        ],
      },
      {
        pullRequestId: 2,
        properties: [
          { name: PR_PROPERTY_DEPENDABOT_PACKAGE_MANAGER, value: 'nuget' },
          {
            name: PR_PROPERTY_DEPENDABOT_DEPENDENCIES,
            value: JSON.stringify({ dependencies: [{ 'dependency-name': 'Newtonsoft.Json' }] }),
          },
        ],
      },
      {
        pullRequestId: 3,
        properties: [
          { name: PR_PROPERTY_DEPENDABOT_PACKAGE_MANAGER, value: 'npm_and_yarn' },
          {
            name: PR_PROPERTY_DEPENDABOT_DEPENDENCIES,
            value: JSON.stringify([{ 'dependency-name': 'express' }]),
          },
        ],
      },
    ];

    const result = parsePullRequestProperties(prs, 'npm_and_yarn');

    expect(result).toHaveLength(2);
    expect(result[0]!['pr-number']).toBe(1);
    expect(result[0]!.dependencies[0]!['dependency-name']).toBe('lodash');
    expect(result[1]!['pr-number']).toBe(3);
    expect(result[1]!.dependencies[0]!['dependency-name']).toBe('express');
  });

  it('returns empty array when no matching package manager found', () => {
    const prs: AzdoPrExtractedWithProperties[] = [
      {
        pullRequestId: 1,
        properties: [
          { name: PR_PROPERTY_DEPENDABOT_PACKAGE_MANAGER, value: 'npm_and_yarn' },
          {
            name: PR_PROPERTY_DEPENDABOT_DEPENDENCIES,
            value: JSON.stringify({ dependencies: [{ 'dependency-name': 'lodash' }] }),
          },
        ],
      },
    ];

    const result = parsePullRequestProperties(prs, 'nuget');

    expect(result).toHaveLength(0);
  });
});

describe('getPullRequestForDependencyNames', () => {
  it('finds PR by matching dependency names for new format', () => {
    const prs: AzdoPrExtractedWithProperties[] = [
      {
        pullRequestId: 1,
        properties: [
          { name: PR_PROPERTY_DEPENDABOT_PACKAGE_MANAGER, value: 'npm_and_yarn' },
          {
            name: PR_PROPERTY_DEPENDABOT_DEPENDENCIES,
            value: JSON.stringify({ dependencies: [{ 'dependency-name': 'lodash' }] }),
          },
        ],
      },
      {
        pullRequestId: 2,
        properties: [
          { name: PR_PROPERTY_DEPENDABOT_PACKAGE_MANAGER, value: 'npm_and_yarn' },
          {
            name: PR_PROPERTY_DEPENDABOT_DEPENDENCIES,
            value: JSON.stringify({ dependencies: [{ 'dependency-name': 'express' }] }),
          },
        ],
      },
    ];

    const result = getPullRequestForDependencyNames(prs, 'npm_and_yarn', ['express']);

    expect(result).toBeDefined();
    expect(result!.pullRequestId).toBe(2);
  });

  it('finds PR by matching dependency names for legacy format', () => {
    const prs: AzdoPrExtractedWithProperties[] = [
      {
        pullRequestId: 1,
        properties: [
          { name: PR_PROPERTY_DEPENDABOT_PACKAGE_MANAGER, value: 'npm_and_yarn' },
          {
            name: PR_PROPERTY_DEPENDABOT_DEPENDENCIES,
            value: JSON.stringify([{ 'dependency-name': 'lodash' }]),
          },
        ],
      },
    ];

    const result = getPullRequestForDependencyNames(prs, 'npm_and_yarn', ['lodash']);

    expect(result).toBeDefined();
    expect(result!.pullRequestId).toBe(1);
  });

  it('finds PR with multiple dependencies', () => {
    const prs: AzdoPrExtractedWithProperties[] = [
      {
        pullRequestId: 1,
        properties: [
          { name: PR_PROPERTY_DEPENDABOT_PACKAGE_MANAGER, value: 'npm_and_yarn' },
          {
            name: PR_PROPERTY_DEPENDABOT_DEPENDENCIES,
            value: JSON.stringify({
              'dependency-group-name': 'dev-dependencies',
              dependencies: [{ 'dependency-name': 'lodash' }, { 'dependency-name': 'express' }],
            }),
          },
        ],
      },
    ];

    const result = getPullRequestForDependencyNames(prs, 'npm_and_yarn', ['lodash', 'express'], 'dev-dependencies');

    expect(result).toBeDefined();
    expect(result!.pullRequestId).toBe(1);
  });

  it('returns undefined when no matching PR found', () => {
    const prs: AzdoPrExtractedWithProperties[] = [
      {
        pullRequestId: 1,
        properties: [
          { name: PR_PROPERTY_DEPENDABOT_PACKAGE_MANAGER, value: 'npm_and_yarn' },
          {
            name: PR_PROPERTY_DEPENDABOT_DEPENDENCIES,
            value: JSON.stringify({ dependencies: [{ 'dependency-name': 'lodash' }] }),
          },
        ],
      },
    ];

    const result = getPullRequestForDependencyNames(prs, 'npm_and_yarn', ['express']);

    expect(result).toBeUndefined();
  });

  it('returns undefined when package manager does not match', () => {
    const prs: AzdoPrExtractedWithProperties[] = [
      {
        pullRequestId: 1,
        properties: [
          { name: PR_PROPERTY_DEPENDABOT_PACKAGE_MANAGER, value: 'npm_and_yarn' },
          {
            name: PR_PROPERTY_DEPENDABOT_DEPENDENCIES,
            value: JSON.stringify({ dependencies: [{ 'dependency-name': 'lodash' }] }),
          },
        ],
      },
    ];

    const result = getPullRequestForDependencyNames(prs, 'nuget', ['lodash']);

    expect(result).toBeUndefined();
  });

  it('does not match when dependency names differ in order but are otherwise equal', () => {
    const prs: AzdoPrExtractedWithProperties[] = [
      {
        pullRequestId: 1,
        properties: [
          { name: PR_PROPERTY_DEPENDABOT_PACKAGE_MANAGER, value: 'npm_and_yarn' },
          {
            name: PR_PROPERTY_DEPENDABOT_DEPENDENCIES,
            value: JSON.stringify({
              dependencies: [{ 'dependency-name': 'lodash' }, { 'dependency-name': 'express' }],
            }),
          },
        ],
      },
    ];

    // areEqual checks that arrays contain same elements regardless of order
    const result = getPullRequestForDependencyNames(prs, 'npm_and_yarn', ['express', 'lodash']);

    expect(result).toBeDefined();
    expect(result!.pullRequestId).toBe(1);
  });

  it('finds grouped PR by group name even with different dependency names', () => {
    const prs: AzdoPrExtractedWithProperties[] = [
      {
        pullRequestId: 1,
        properties: [
          { name: PR_PROPERTY_DEPENDABOT_PACKAGE_MANAGER, value: 'nuget' },
          {
            name: PR_PROPERTY_DEPENDABOT_DEPENDENCIES,
            value: JSON.stringify({
              'dependency-group-name': 'System-Commandline',
              dependencies: [
                { 'dependency-name': 'System.CommandLine.Hosting', 'dependency-version': '0.4.0-alpha.25320.106' },
                { 'dependency-name': 'System.CommandLine.Rendering', 'dependency-version': '0.4.0-alpha.25320.106' },
              ],
            }),
          },
        ],
      },
    ];

    // Looking for PR with just one dependency, but same group name
    const result = getPullRequestForDependencyNames(prs, 'nuget', ['System.CommandLine.Hosting'], 'System-Commandline');

    expect(result).toBeDefined();
    expect(result!.pullRequestId).toBe(1);
  });

  it('does not find grouped PR when group name differs', () => {
    const prs: AzdoPrExtractedWithProperties[] = [
      {
        pullRequestId: 1,
        properties: [
          { name: PR_PROPERTY_DEPENDABOT_PACKAGE_MANAGER, value: 'npm_and_yarn' },
          {
            name: PR_PROPERTY_DEPENDABOT_DEPENDENCIES,
            value: JSON.stringify({
              'dependency-group-name': 'production',
              dependencies: [{ 'dependency-name': 'lodash' }],
            }),
          },
        ],
      },
    ];

    const result = getPullRequestForDependencyNames(prs, 'npm_and_yarn', ['lodash'], 'development');

    expect(result).toBeUndefined();
  });

  it('does not find non-grouped PR when searching with group name', () => {
    const prs: AzdoPrExtractedWithProperties[] = [
      {
        pullRequestId: 1,
        properties: [
          { name: PR_PROPERTY_DEPENDABOT_PACKAGE_MANAGER, value: 'npm_and_yarn' },
          {
            name: PR_PROPERTY_DEPENDABOT_DEPENDENCIES,
            value: JSON.stringify({
              dependencies: [{ 'dependency-name': 'lodash' }],
            }),
          },
        ],
      },
    ];

    const result = getPullRequestForDependencyNames(prs, 'npm_and_yarn', ['lodash'], 'production');

    expect(result).toBeUndefined();
  });

  it('does not find grouped PR when searching without group name', () => {
    const prs: AzdoPrExtractedWithProperties[] = [
      {
        pullRequestId: 1,
        properties: [
          { name: PR_PROPERTY_DEPENDABOT_PACKAGE_MANAGER, value: 'npm_and_yarn' },
          {
            name: PR_PROPERTY_DEPENDABOT_DEPENDENCIES,
            value: JSON.stringify({
              'dependency-group-name': 'production',
              dependencies: [{ 'dependency-name': 'lodash' }],
            }),
          },
        ],
      },
    ];

    // Searching for exact dependency match without group name should not find grouped PR
    const result = getPullRequestForDependencyNames(prs, 'npm_and_yarn', ['lodash']);

    expect(result).toBeUndefined();
  });
});

describe('getPersistedPr and buildPullRequestProperties', () => {
  it('round-trip: persisted format excludes pr-number, runtime format includes it', () => {
    const createData: DependabotCreatePullRequest = {
      dependencies: [
        { name: 'lodash', version: '4.17.21', directory: '/' },
        { name: 'express', version: '4.18.0', directory: '/' },
      ],
      'dependency-group': { name: 'production' },
      'base-commit-sha': 'abc123',
      'commit-message': 'Update dependencies',
      'updated-dependency-files': [],
      'pr-title': 'Bump dependencies',
      'pr-body': 'This PR updates dependencies.',
    };

    // Write: Create persisted format (should NOT have pr-number)
    const persisted = getPersistedPr(createData);
    expect(persisted).not.toHaveProperty('pr-number');
    expect(persisted['dependency-group-name']).toBe('production');
    expect(persisted.dependencies).toHaveLength(2);

    // Serialize to properties
    const properties = buildPullRequestProperties('npm_and_yarn', persisted);
    const serialized = JSON.parse(properties.find((p) => p.name === PR_PROPERTY_DEPENDABOT_DEPENDENCIES)!.value);
    expect(serialized).not.toHaveProperty('pr-number');

    // Read: Parse back from PR (should add pr-number)
    const pr: AzdoPrExtractedWithProperties = {
      pullRequestId: 456,
      properties,
    };
    const parsed = parsePullRequestProps(pr);
    expect(parsed['pr-number']).toBe(456);
    if (!('dependency-group-name' in parsed)) {
      throw new Error('Expected dependency-group-name to be defined');
    }
    expect(parsed['dependency-group-name']!).toBe('production');
  });
});
