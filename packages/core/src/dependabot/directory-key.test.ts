import { describe, expect, it } from 'vitest';

import { makeDirectoryKey } from './directory-key';

describe('makeDirectoryKey', () => {
  it('should create key with ecosystem and single directory', () => {
    const result = makeDirectoryKey({
      ecosystem: 'npm',
      directory: '/src',
    });

    expect(result).toBe('npm::/src');
  });

  it('should create key with package-ecosystem naming convention', () => {
    const result = makeDirectoryKey({
      'package-ecosystem': 'bundler',
      directory: '/app',
    });

    expect(result).toBe('bundler::/app');
  });

  it('should create key with multiple directories', () => {
    const result = makeDirectoryKey({
      ecosystem: 'pip',
      directories: ['/backend', '/scripts'],
    });

    expect(result).toBe('pip::/backend,/scripts');
  });

  it('should prefer single directory over directories array', () => {
    const result = makeDirectoryKey({
      ecosystem: 'npm',
      directory: '/primary',
      directories: ['/secondary', '/tertiary'],
    });

    expect(result).toBe('npm::/primary');
  });

  it('should handle null directory by using directories array', () => {
    const result = makeDirectoryKey({
      ecosystem: 'npm',
      directory: null,
      directories: ['/frontend'],
    });

    expect(result).toBe('npm::/frontend');
  });
});
