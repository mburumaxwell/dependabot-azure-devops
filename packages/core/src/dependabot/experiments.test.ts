import { describe, expect, test } from 'vitest';
import { setExperiment } from './experiments';
import type { DependabotExperiments } from './job';

describe('setExperiment', () => {
  test('sets experiment to undefined experiments with default true', () => {
    expect(setExperiment(undefined, 'feature-x')).toEqual({ 'feature-x': true });
  });

  test('sets boolean true explicitly', () => {
    expect(setExperiment({}, 'enabled-flag', true)).toEqual({ 'enabled-flag': true });
  });

  test('sets string value', () => {
    const base = { existing: true };
    expect(setExperiment(base, 'new-value', 'v1.2.3')).toEqual({
      existing: true,
      'new-value': 'v1.2.3',
    });
  });

  test('overwrites existing key with new value', () => {
    const original = { key: 'old' };
    expect(setExperiment(original, 'key', 'new')).toEqual({ key: 'new' });
  });

  test('does not mutate the original experiments object', () => {
    const original = { a: true } as DependabotExperiments;
    const result = setExperiment(original, 'b', true);
    expect(result).toEqual({ a: true, b: true });
    expect(original).toEqual({ a: true });
  });
});
