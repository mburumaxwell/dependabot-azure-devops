/**
 * Options for creating a directory key that supports both naming conventions:
 * - `ecosystem` (standard format)
 * - `package-ecosystem` (alternative format for compatibility)
 *
 * Either a single `directory` or multiple `directories` can be specified.
 */
type MakeDirectoryKeyOptions =
  | {
      /** The package ecosystem (e.g., 'npm', 'pip', 'bundler') */
      ecosystem: string;
      /** Single directory path (optional if directories is provided) */
      directory?: string | null;
      /** Multiple directory paths (optional if directory is provided) */
      directories?: string[];
    }
  | {
      /** The package ecosystem using alternative naming convention */
      'package-ecosystem': string;
      /** Single directory path (optional if directories is provided) */
      directory?: string | null;
      /** Multiple directory paths (optional if directory is provided) */
      directories?: string[];
    };

/**
 * Creates a unique directory key by combining the ecosystem and directory information.
 *
 * The key format is: `{ecosystem}::{directory_info}`
 * - For single directory: `npm::/src/frontend`
 * - For multiple directories: `npm::/src/frontend,/src/backend`
 *
 * @param options - Configuration object containing ecosystem and directory information
 * @returns A unique string key in the format `{ecosystem}::{directories}`
 *
 * @example
 * ```typescript
 * // Single directory
 * const key1 = makeDirectoryKey({ ecosystem: 'npm', directory: '/src' });
 * // Returns: "npm::/src"
 *
 * // Multiple directories
 * const key2 = makeDirectoryKey({
 *   ecosystem: 'pip',
 *   directories: ['/backend', '/scripts']
 * });
 * // Returns: "pip::/backend,/scripts"
 *
 * // Using alternative naming convention
 * const key3 = makeDirectoryKey({
 *   'package-ecosystem': 'bundler',
 *   directory: '/app'
 * });
 * // Returns: "bundler::/app"
 * ```
 */
export function makeDirectoryKey(options: MakeDirectoryKeyOptions): string {
  // Extract ecosystem name from either naming convention
  const ecosystem = 'ecosystem' in options ? options.ecosystem : options['package-ecosystem'];

  // Use single directory if provided, otherwise join multiple directories with comma
  const directoryPart = options.directory ?? options.directories!.join(',');

  return `${ecosystem}::${directoryPart}`;
}
