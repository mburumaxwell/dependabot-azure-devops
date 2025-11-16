export type GenerateKeyOptions = {
  /** Length in bytes (default: 32) */
  length?: number;
  /** Encoding format (default: 'base62') */
  encoding?: 'base64' | 'base64url' | 'base62' | 'hex';
};

/**
 * Generates a cryptographically secure random key.
 *
 * @param options Configuration options for key generation
 * @returns A randomly generated key string
 *
 * @example
 * ```typescript
 * // Generate a 32-byte base62 token (default)
 * const token = generateKey();
 *
 * // Generate a 16-byte hex key
 * const token = generateKey({ length: 16, encoding: 'hex' });
 *
 * // Generate a 20-byte base64url key
 * const token = generateKey({ length: 20, encoding: 'base64url' });
 *
 * // Generate a 64-byte base64 key with padding
 * const key = generateKey({ length: 64, encoding: 'base64' });
 * ```
 */
export function generateKey({ length = 32, encoding = 'base62' }: GenerateKeyOptions = {}): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  const buffer = Buffer.from(bytes);

  switch (encoding) {
    case 'base64':
      return buffer.toString('base64');

    case 'base64url':
      return buffer.toString('base64url');

    case 'base62': {
      const base62Chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
      let result = '';
      let value = BigInt(`0x${buffer.toString('hex')}`);

      while (value > 0) {
        const remainder = value % BigInt(62);
        result = base62Chars[Number(remainder)] + result;
        value = value / BigInt(62);
      }

      return result || '0';
    }

    case 'hex':
      return buffer.toString('hex');

    default:
      throw new Error(`Unsupported encoding: ${encoding}`);
  }
}
