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
