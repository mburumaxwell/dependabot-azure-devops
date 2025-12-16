import { type ClassValue, clsx } from 'clsx';
import type { useRouter } from 'next/navigation';
import prettyMs from 'pretty-ms';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(input: string | number | Date): string {
  const date = new Date(input);
  return date.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export type InitialsType = 'all' | 'first';
export function getInitials(value: string, type: InitialsType = 'all') {
  return value
    .split(/[\s@]+/)
    .map((p) => p[0])
    .slice(0, type === 'first' ? 1 : 2)
    .join('')
    .toUpperCase();
}

export function trimLeadingSlash(value: string): string {
  return value.replace(/^\/+/, ''); // removes one or more leading slashes
}

export function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, ''); // removes one or more trailing slashes
}

export function trimSlashes(value: string): string {
  return trimLeadingSlash(trimTrailingSlash(value));
}

export async function streamToString(readable: NodeJS.ReadableStream | undefined): Promise<string> {
  if (!readable) return '';
  const chunks: Uint8Array[] = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

/**
 * Formats a duration in milliseconds to a human-readable string.
 * @param value The value in milliseconds
 * @param compact Whether to only show the most significant unit
 */
export function formatDuration(value: number, compact: boolean = false): string {
  return prettyMs(value, { unitCount: 2, compact });
}

/**
 * Updates search parameters based on the provided updates.
 * @param original The original search parameters.
 * @param updates An object containing key-value pairs to update.
 * @param clear Whether to clear existing parameters before applying updates.
 * @returns A new `URLSearchParams` object with the updates applied.
 */
export function updateSearchParams(
  original: URLSearchParams | Record<string, string>,
  updates: Record<string, string>,
  clear: boolean = false,
) {
  const params = new URLSearchParams(clear ? '' : new URLSearchParams(original).toString());
  Object.entries(updates).forEach(([key, value]) => {
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
  });
  return params;
}

/**
 * Updates filters in the search parameters and navigates to the updated URL.
 * @param router The Next.js App router instance.
 * @param searchParams The current search parameters.
 * @param updates An object containing key-value pairs to update.
 * @param clear Whether to clear existing parameters before applying updates.
 * @returns A promise that resolves when the navigation is complete.
 */
export function updateFiltersInSearchParams(
  router: ReturnType<typeof useRouter>,
  searchParams: URLSearchParams,
  updates: Record<string, string>,
  clear: boolean = false,
) {
  return router.push(`?${updateSearchParams(searchParams, updates, clear).toString()}`);
}
