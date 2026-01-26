import { describe, expect, it } from 'vitest';
import type { DependabotPersistedPr } from './job';
import { shouldSupersede } from './utils';

describe('shouldSupersede', () => {
  it('returns false when there are no overlapping dependencies', () => {
    const oldPr: DependabotPersistedPr = {
      'dependency-group-name': null,
      dependencies: [
        { 'dependency-name': 'lodash', 'dependency-version': '4.17.20' },
        { 'dependency-name': 'express', 'dependency-version': '4.18.0' },
      ],
    };

    const newPr: DependabotPersistedPr = {
      'dependency-group-name': null,
      dependencies: [
        { 'dependency-name': 'react', 'dependency-version': '18.0.0' },
        { 'dependency-name': 'vue', 'dependency-version': '3.0.0' },
      ],
    };

    expect(shouldSupersede(oldPr, newPr)).toBe(false);
  });

  it('returns false when overlapping dependencies have the same version (rebase scenario)', () => {
    const oldPr: DependabotPersistedPr = {
      'dependency-group-name': null,
      dependencies: [
        { 'dependency-name': 'lodash', 'dependency-version': '4.17.21' },
        { 'dependency-name': 'express', 'dependency-version': '4.18.0' },
      ],
    };

    const newPr: DependabotPersistedPr = {
      'dependency-group-name': null,
      dependencies: [
        { 'dependency-name': 'lodash', 'dependency-version': '4.17.21' },
        { 'dependency-name': 'react', 'dependency-version': '18.0.0' },
      ],
    };

    expect(shouldSupersede(oldPr, newPr)).toBe(false);
  });

  it('returns true when overlapping dependencies have different versions', () => {
    const oldPr: DependabotPersistedPr = {
      'dependency-group-name': 'one',
      dependencies: [
        { 'dependency-name': 'lodash', 'dependency-version': '4.17.20' },
        { 'dependency-name': 'express', 'dependency-version': '4.18.0' },
      ],
    };

    const newPr: DependabotPersistedPr = {
      'dependency-group-name': 'one',
      dependencies: [
        { 'dependency-name': 'lodash', 'dependency-version': '4.17.21' },
        { 'dependency-name': 'express', 'dependency-version': '4.18.0' },
      ],
    };

    expect(shouldSupersede(oldPr, newPr)).toBe(true);
  });

  it('returns false when dependency sets differ (different scope)', () => {
    // Old PR: lodash + express
    // New PR: lodash + react
    // Even though lodash version changed, they're different scopes
    const oldPr: DependabotPersistedPr = {
      'dependency-group-name': null,
      dependencies: [
        { 'dependency-name': 'lodash', 'dependency-version': '4.17.20' },
        { 'dependency-name': 'express', 'dependency-version': '4.18.0' },
      ],
    };

    const newPr: DependabotPersistedPr = {
      'dependency-group-name': null,
      dependencies: [
        { 'dependency-name': 'lodash', 'dependency-version': '4.17.21' },
        { 'dependency-name': 'react', 'dependency-version': '18.0.0' },
      ],
    };

    expect(shouldSupersede(oldPr, newPr)).toBe(false);
  });

  it('returns true when multiple overlapping dependencies have at least one version change', () => {
    const oldPr: DependabotPersistedPr = {
      'dependency-group-name': null,
      dependencies: [
        { 'dependency-name': 'lodash', 'dependency-version': '4.17.20' },
        { 'dependency-name': 'express', 'dependency-version': '4.18.0' },
        { 'dependency-name': 'react', 'dependency-version': '18.0.0' },
      ],
    };

    const newPr: DependabotPersistedPr = {
      'dependency-group-name': null,
      dependencies: [
        { 'dependency-name': 'lodash', 'dependency-version': '4.17.21' },
        { 'dependency-name': 'express', 'dependency-version': '4.18.0' },
        { 'dependency-name': 'react', 'dependency-version': '18.0.0' },
      ],
    };

    expect(shouldSupersede(oldPr, newPr)).toBe(true);
  });

  it('returns false when all overlapping dependencies have the same versions', () => {
    const oldPr: DependabotPersistedPr = {
      'dependency-group-name': null,
      dependencies: [
        { 'dependency-name': 'lodash', 'dependency-version': '4.17.21' },
        { 'dependency-name': 'express', 'dependency-version': '4.18.0' },
        { 'dependency-name': 'react', 'dependency-version': '18.0.0' },
      ],
    };

    const newPr: DependabotPersistedPr = {
      'dependency-group-name': null,
      dependencies: [
        { 'dependency-name': 'lodash', 'dependency-version': '4.17.21' },
        { 'dependency-name': 'express', 'dependency-version': '4.18.0' },
        { 'dependency-name': 'react', 'dependency-version': '18.0.0' },
      ],
    };

    expect(shouldSupersede(oldPr, newPr)).toBe(false);
  });

  it('returns true for dependency group PRs with version changes', () => {
    const oldPr: DependabotPersistedPr = {
      'dependency-group-name': 'production',
      dependencies: [
        { 'dependency-name': 'lodash', 'dependency-version': '4.17.20' },
        { 'dependency-name': 'express', 'dependency-version': '4.18.0' },
      ],
    };

    const newPr: DependabotPersistedPr = {
      'dependency-group-name': 'production',
      dependencies: [
        { 'dependency-name': 'lodash', 'dependency-version': '4.17.21' },
        { 'dependency-name': 'express', 'dependency-version': '4.18.1' },
      ],
    };

    expect(shouldSupersede(oldPr, newPr)).toBe(true);
  });

  it('handles dependencies without version information', () => {
    const oldPr: DependabotPersistedPr = {
      'dependency-group-name': null,
      dependencies: [{ 'dependency-name': 'lodash', 'dependency-version': null }],
    };

    const newPr: DependabotPersistedPr = {
      'dependency-group-name': null,
      dependencies: [{ 'dependency-name': 'lodash', 'dependency-version': '4.17.21' }],
    };

    expect(shouldSupersede(oldPr, newPr)).toBe(true);
  });

  it('returns false when both PRs have empty dependency lists', () => {
    const oldPr: DependabotPersistedPr = {
      'dependency-group-name': null,
      dependencies: [],
    };

    const newPr: DependabotPersistedPr = {
      'dependency-group-name': null,
      dependencies: [],
    };

    expect(shouldSupersede(oldPr, newPr)).toBe(false);
  });

  it('returns false when old PR has dependencies but new PR is empty', () => {
    const oldPr: DependabotPersistedPr = {
      'dependency-group-name': null,
      dependencies: [{ 'dependency-name': 'lodash', 'dependency-version': '4.17.21' }],
    };

    const newPr: DependabotPersistedPr = {
      'dependency-group-name': null,
      dependencies: [],
    };

    expect(shouldSupersede(oldPr, newPr)).toBe(false);
  });

  it('handles dependencies with directory field', () => {
    // Different dependency sets - shouldn't supersede even with version change
    const oldPr: DependabotPersistedPr = {
      'dependency-group-name': null,
      dependencies: [
        { 'dependency-name': 'lodash', 'dependency-version': '4.17.20', directory: '/frontend' },
        { 'dependency-name': 'express', 'dependency-version': '4.18.0', directory: '/backend' },
      ],
    };

    const newPr: DependabotPersistedPr = {
      'dependency-group-name': null,
      dependencies: [
        { 'dependency-name': 'lodash', 'dependency-version': '4.17.21', directory: '/frontend' },
        { 'dependency-name': 'react', 'dependency-version': '18.0.0', directory: '/frontend' },
      ],
    };

    expect(shouldSupersede(oldPr, newPr)).toBe(false);
  });

  it('returns true when version changes from a value to null', () => {
    const oldPr: DependabotPersistedPr = {
      'dependency-group-name': null,
      dependencies: [{ 'dependency-name': 'lodash', 'dependency-version': '4.17.20' }],
    };

    const newPr: DependabotPersistedPr = {
      'dependency-group-name': null,
      dependencies: [{ 'dependency-name': 'lodash', 'dependency-version': null }],
    };

    expect(shouldSupersede(oldPr, newPr)).toBe(true);
  });

  it('returns true when version changes from null to a value', () => {
    const oldPr: DependabotPersistedPr = {
      'dependency-group-name': null,
      dependencies: [{ 'dependency-name': 'lodash', 'dependency-version': null }],
    };

    const newPr: DependabotPersistedPr = {
      'dependency-group-name': null,
      dependencies: [{ 'dependency-name': 'lodash', 'dependency-version': '4.17.21' }],
    };

    expect(shouldSupersede(oldPr, newPr)).toBe(true);
  });

  it('returns true when same group has version changes even with different dependency sets', () => {
    const oldPr: DependabotPersistedPr = {
      'dependency-group-name': 'production',
      dependencies: [
        { 'dependency-name': 'lodash', 'dependency-version': '4.17.20' },
        { 'dependency-name': 'express', 'dependency-version': '4.18.0' },
      ],
    };

    const newPr: DependabotPersistedPr = {
      'dependency-group-name': 'production',
      dependencies: [
        { 'dependency-name': 'lodash', 'dependency-version': '4.17.21' },
        { 'dependency-name': 'react', 'dependency-version': '18.0.0' },
      ],
    };

    expect(shouldSupersede(oldPr, newPr)).toBe(true);
  });

  it('returns false when different groups even with overlapping dependencies', () => {
    const oldPr: DependabotPersistedPr = {
      'dependency-group-name': 'production',
      dependencies: [{ 'dependency-name': 'lodash', 'dependency-version': '4.17.20' }],
    };

    const newPr: DependabotPersistedPr = {
      'dependency-group-name': 'development',
      dependencies: [{ 'dependency-name': 'lodash', 'dependency-version': '4.17.21' }],
    };

    expect(shouldSupersede(oldPr, newPr)).toBe(false);
  });

  it('returns false when one has group and one does not', () => {
    const oldPr: DependabotPersistedPr = {
      'dependency-group-name': 'production',
      dependencies: [{ 'dependency-name': 'lodash', 'dependency-version': '4.17.20' }],
    };

    const newPr: DependabotPersistedPr = {
      'dependency-group-name': null,
      dependencies: [{ 'dependency-name': 'lodash', 'dependency-version': '4.17.21' }],
    };

    expect(shouldSupersede(oldPr, newPr)).toBe(false);
  });
});
