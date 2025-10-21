import { z } from 'zod/v4';
import { DependabotPackageManagerSchema, DependabotSourceProviderSchema } from '@/dependabot';

/**
 * @example
 * ```json
 * {
 *   "host": {
 *     "platform": "darwin",
 *     "os": "25.0.0",
 *     "arch": "arm64",
 *     "machine-hash": "d3bbb66be2ad9dfab10af69b450f7e7e814ef7bbf1277a6d0df9e1db44ba4f5c"
 *   },
 *   "trigger": "user",
 *   "provider": "azure",
 *   "owner": "https://dev.azure.com/tingle/",
 *   "package-manager": "terraform",
 *   "version": "0.9.0",
 *   "id": 2850677077,
 *   "started": "2025-10-03T14:44:00.191Z",
 *   "duration": 31812,
 *   "success": true
 * }
 * ```
 */
export const UsageTelemetryRequestDataSchema = z.object({
  host: z.object({
    platform: z.string().max(50), // e.g. linux, darwin, win32
    release: z.string().max(100), // e.g. 26.0.0, 10.0.19043
    arch: z.string().max(50), // e.g. x64, arm64
    'machine-hash': z.string().max(250), // e.g. "d3bbb66be2ad9dfab10af69b450f7e7e814ef7bbf1277a6d0df9e1db44ba4f5c" for "Maxwells-MacBook-Pro.local"
  }),
  version: z.string().max(50),
  trigger: z.enum(['user', 'service']),
  provider: DependabotSourceProviderSchema,
  owner: z.url(),
  project: z.url().optional(), // was added later hence optional for backward compatibility
  'package-manager': DependabotPackageManagerSchema,
  id: z.number(), // job identifier, for correlation
  started: z.coerce.date(),
  duration: z.number().min(0), // in milliseconds
  success: z.boolean(),
});

/**
 * @example
 * ```json
 * {
 *   "host": {
 *     "platform": "darwin",
 *     "os": "25.0.0",
 *     "arch": "arm64",
 *     "machine-hash": "d3bbb66be2ad9dfab10af69b450f7e7e814ef7bbf1277a6d0df9e1db44ba4f5c"
 *   },
 *   "trigger": "user",
 *   "provider": "azure",
 *   "owner": "https://dev.azure.com/tingle/",
 *   "package-manager": "terraform",
 *   "version": "0.9.0",
 *   "id": 2850677077,
 *   "started": "2025-10-03T14:44:00.191Z",
 *   "duration": 31812,
 *   "success": true
 * }
 * ```
 */
export type UsageTelemetryRequestData = z.infer<typeof UsageTelemetryRequestDataSchema>;
