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

import prettyMs from 'pretty-ms';
export function formatDuration(milliseconds: number) {
  return prettyMs(milliseconds, { unitCount: 2 });
}
