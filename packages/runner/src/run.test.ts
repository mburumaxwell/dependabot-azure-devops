import { describe, expect, it } from 'vitest';
import { isRunningInDocker } from './run';

describe('isRunningInDocker', () => {
  it('should return a boolean', async () => {
    const result = await isRunningInDocker();
    expect(typeof result).toBe('boolean');
  });
});
