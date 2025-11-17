import { z } from 'zod';
import type { OrganizationBillingInterval, OrganizationTier } from '@/lib/prisma';

export const OrganizationTierSchema = z.enum(['free', 'pro', 'enterprise']);
export const OrganizationBillingIntervalSchema = z.enum(['monthly', 'yearly']);

export type OrganizationTierInfo = {
  type: OrganizationTier;
  name: string;
  description: string;
  maxProjects: number;
  maxRepositoriesPerProject: number;
  tagline: string;
  features: string[];
  // Stripe lookup_keys (matching the Price objects in Stripe)
  stripe?: Partial<Record<OrganizationBillingInterval, string>>;
};

export const ORGANIZATION_TIERS_INFO = new Map<OrganizationTier, OrganizationTierInfo>([
  [
    'free',
    {
      type: 'free',
      name: 'Free',
      description: 'A free tier for a single project and repository.',
      maxProjects: 1,
      maxRepositoriesPerProject: 1,
      tagline: 'Kick the tyres.',
      features: ['1 project', 'Community support', 'Basic rate limits'],
      stripe: {
        monthly: 'free_monthly',
      },
    },
  ],
  [
    'pro',
    {
      type: 'pro',
      name: 'Pro',
      description: 'A pro tier for larger teams and projects.',
      maxProjects: 10, // TODO: remove this limit
      maxRepositoriesPerProject: 100, // TODO: remove this limit
      tagline: 'Grow without friction.',
      features: ['Basic plus', 'Unlimited projects', 'Priority support'],
      stripe: {
        monthly: 'pro_monthly',
      },
    },
  ],
  [
    'enterprise',
    {
      type: 'enterprise',
      name: 'Enterprise',
      description: 'An enterprise tier for organizations with advanced needs.',
      maxProjects: 100, // TODO: remove this limit
      maxRepositoriesPerProject: 1000, // TODO: remove this limit
      tagline: 'Scale with confidence.',
      features: ['Pro plus', 'Dedicated support', 'Single Sign-On (SSO)'],
    },
  ],
]);
export const ORGANIZATION_TIERS = Array.from(ORGANIZATION_TIERS_INFO.keys());

export function getOrganizationTierInfo(tier: OrganizationTier) {
  return ORGANIZATION_TIERS_INFO.get(tier)!;
}
