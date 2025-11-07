import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(input: string | number | Date): string {
  const date = new Date(input);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export type GenerateKeyOptions = {
  /** Length in bytes (default: 32) */
  length?: number;
  /** Encoding format (default: 'base64url') */
  encoding?: 'base64' | 'base64url' | 'base32' | 'hex';
};

/**
 * Generates a cryptographically secure random key.
 *
 * @param options Configuration options for key generation
 * @returns A randomly generated key string
 *
 * @example
 * ```typescript
 * // Generate a 32-byte base64url token (default)
 * const token = generateKey();
 *
 * // Generate a 16-byte hex key
 * const token = generateKey({ length: 16, encoding: 'hex' });
 *
 * // Generate a 20-byte base32 key
 * const token = generateKey({ length: 20, encoding: 'base32' });
 *
 * // Generate a 64-byte base64 key with padding
 * const key = generateKey({ length: 64, encoding: 'base64' });
 * ```
 */
export function generateKey(options: GenerateKeyOptions = {}): string {
  const { length = 32, encoding = 'base64url' } = options;

  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  const buffer = Buffer.from(bytes);

  switch (encoding) {
    case 'base64':
      return buffer.toString('base64');

    case 'base64url':
      return buffer.toString('base64url');

    case 'base32': {
      // RFC 4648 Base32 encoding
      const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
      let result = '';
      let bufferValue = 0;
      let bitsLeft = 0;

      for (const byte of bytes) {
        bufferValue = (bufferValue << 8) | byte;
        bitsLeft += 8;

        while (bitsLeft >= 5) {
          result += base32Chars[(bufferValue >>> (bitsLeft - 5)) & 31];
          bitsLeft -= 5;
        }
      }

      if (bitsLeft > 0) {
        result += base32Chars[(bufferValue << (5 - bitsLeft)) & 31];
      }

      return result;
    }

    case 'hex':
      return buffer.toString('hex');

    default:
      throw new Error(`Unsupported encoding: ${encoding}`);
  }
}
