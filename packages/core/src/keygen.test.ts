import { describe, expect, it } from 'vitest';
import { type GenerateKeyOptions, generateKey } from './keygen';

describe('generateKey', () => {
  describe('basic functionality', () => {
    it('generates a string', () => {
      const key = generateKey();
      expect(typeof key).toBe('string');
      expect(key.length).toBeGreaterThan(0);
    });

    it('generates different keys on each call', () => {
      const key1 = generateKey();
      const key2 = generateKey();
      expect(key1).not.toBe(key2);
    });

    it('uses default values when no options provided', () => {
      const key = generateKey();
      // 32 bytes in base62 should be a variable length string (alphanumeric only)
      expect(key.length).toBeGreaterThan(0);
      expect(key).toMatch(/^[A-Za-z0-9]+$/);
    });
  });

  describe('length parameter', () => {
    it('generates keys of specified byte length', () => {
      const testCases = [
        { bytes: 8, expectedBase64UrlLength: 11 }, // 8 * 4/3 ≈ 10.67 → 11 (no padding)
        { bytes: 16, expectedBase64UrlLength: 22 }, // 16 * 4/3 ≈ 21.33 → 22 (no padding)
        { bytes: 32, expectedBase64UrlLength: 43 }, // 32 * 4/3 ≈ 42.67 → 43 (no padding)
        { bytes: 64, expectedBase64UrlLength: 86 }, // 64 * 4/3 ≈ 85.33 → 86 (no padding)
      ];

      for (const { bytes, expectedBase64UrlLength } of testCases) {
        const key = generateKey({ length: bytes, encoding: 'base64url' });
        expect(key.length).toBe(expectedBase64UrlLength);
      }
    });

    it('handles small lengths correctly', () => {
      const key = generateKey({ length: 1, encoding: 'hex' });
      expect(key.length).toBe(2); // 1 byte = 2 hex chars
    });

    it('handles large lengths correctly', () => {
      const key = generateKey({ length: 128, encoding: 'hex' });
      expect(key.length).toBe(256); // 128 bytes = 256 hex chars
    });
  });

  describe('encoding formats', () => {
    describe('base64 encoding', () => {
      it('generates valid base64 strings', () => {
        const key = generateKey({ length: 32, encoding: 'base64' });
        expect(key).toMatch(/^[A-Za-z0-9+/]*={0,2}$/);
        expect(key.length).toBe(44); // 32 bytes with padding
      });

      it('includes padding characters', () => {
        const key = generateKey({ length: 31, encoding: 'base64' });
        expect(key.endsWith('=')).toBe(true);
      });

      it('can be decoded back to original length', () => {
        const originalLength = 32;
        const key = generateKey({ length: originalLength, encoding: 'base64' });
        const decoded = atob(key);
        expect(decoded.length).toBe(originalLength);
      });
    });

    describe('base64url encoding', () => {
      it('generates valid base64url strings', () => {
        const key = generateKey({ length: 32, encoding: 'base64url' });
        expect(key).toMatch(/^[A-Za-z0-9_-]*$/);
        expect(key).not.toMatch(/[+/=]/); // No standard base64 chars or padding
      });

      it('has no padding', () => {
        const key = generateKey({ length: 31, encoding: 'base64url' });
        expect(key.endsWith('=')).toBe(false);
      });

      it('is URL safe', () => {
        const key = generateKey({ length: 64, encoding: 'base64url' });
        expect(decodeURIComponent(key)).toBe(key); // Should not need URL decoding
      });
    });

    describe('base62 encoding', () => {
      it('generates valid base62 strings', () => {
        const key = generateKey({ length: 20, encoding: 'base62' });
        expect(key).toMatch(/^[A-Za-z0-9]*$/);
      });

      it('uses correct base62 alphabet', () => {
        const key = generateKey({ length: 32, encoding: 'base62' });
        const validChars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        for (const char of key) {
          expect(validChars.includes(char)).toBe(true);
        }
      });

      it('generates consistent length output', () => {
        const key = generateKey({ length: 20, encoding: 'base62' });
        expect(key.length).toBeGreaterThan(0);
        expect(key.length).toBeLessThan(40); // Reasonable upper bound
      });
    });

    describe('hex encoding', () => {
      it('generates valid hex strings', () => {
        const key = generateKey({ length: 16, encoding: 'hex' });
        expect(key).toMatch(/^[0-9a-f]*$/);
        expect(key.length).toBe(32); // 16 bytes = 32 hex chars
      });

      it('uses lowercase hex digits', () => {
        const key = generateKey({ length: 32, encoding: 'hex' });
        expect(key).toBe(key.toLowerCase());
      });

      it('pads single digits with zero', () => {
        // Generate multiple keys to test consistent padding
        for (let i = 0; i < 10; i++) {
          const key = generateKey({ length: 1, encoding: 'hex' });
          expect(key.length).toBe(2);
          expect(key).toMatch(/^[0-9a-f]{2}$/);
        }
      });
    });
  });

  describe('error handling', () => {
    it('throws error for unsupported encoding', () => {
      expect(() => {
        // @ts-expect-error testing invalid encoding
        generateKey({ encoding: 'unsupported' });
      }).toThrow('Unsupported encoding: unsupported');
    });
  });

  describe('entropy and randomness', () => {
    it('generates unique keys consistently', () => {
      const keys = new Set();
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        const key = generateKey({ length: 16 });
        keys.add(key);
      }

      // All keys should be unique
      expect(keys.size).toBe(iterations);
    });

    it('has good character distribution', () => {
      // Generate a longer key to test character distribution
      const key = generateKey({ length: 500, encoding: 'hex' });
      const hexChars = '0123456789abcdef';

      // All hex characters should appear at least once
      for (const char of hexChars) {
        expect(key.includes(char)).toBe(true);
      }
    });
  });

  describe('options parameter handling', () => {
    it('works with empty options object', () => {
      const key = generateKey({});
      expect(typeof key).toBe('string');
      expect(key.length).toBeGreaterThan(0); // default 32 bytes base62
      expect(key).toMatch(/^[A-Za-z0-9]+$/);
    });

    it('works with partial options', () => {
      const hexKey = generateKey({ encoding: 'hex' });
      expect(hexKey.length).toBe(64); // default 32 bytes as hex
      expect(hexKey).toMatch(/^[0-9a-f]*$/);

      const shortKey = generateKey({ length: 8 });
      expect(shortKey.length).toBeGreaterThan(0); // 8 bytes as base62
      expect(shortKey).toMatch(/^[A-Za-z0-9]+$/);
    });

    it('handles zero length gracefully', () => {
      const key = generateKey({ length: 0, encoding: 'hex' });
      expect(key).toBe('');
    });
  });

  describe('type safety', () => {
    it('accepts valid GenerateKeyOptions', () => {
      const validOptions: GenerateKeyOptions[] = [
        {},
        { length: 16 },
        { encoding: 'hex' },
        { length: 32, encoding: 'base64url' },
        { length: 20, encoding: 'base62' },
      ];

      for (const options of validOptions) {
        expect(() => generateKey(options)).not.toThrow();
      }
    });
  });
});
