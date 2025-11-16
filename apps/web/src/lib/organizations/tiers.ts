import { z } from 'zod';
import type { OrganizationTier } from '@/lib/prisma';

export const OrganizationTierSchema = z.enum(['free', 'pro', 'enterprise']);

export type OrganizationTierInfo = {
  type: OrganizationTier;
  name: string;
  description: string;
  maxProjects: number;
  maxRepositoriesPerProject: number;
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
    },
  ],
  [
    'pro',
    {
      type: 'pro',
      name: 'Pro',
      description: 'A pro tier for larger teams and projects.',
      maxProjects: 10,
      maxRepositoriesPerProject: 100, // higher should go to a new tier
    },
  ],
  [
    'enterprise',
    {
      type: 'enterprise',
      name: 'Enterprise',
      description: 'An enterprise tier for organizations with advanced needs.',
      maxProjects: 100,
      maxRepositoriesPerProject: 1000,
    },
  ],
]);
export const ORGANIZATION_TIERS = Array.from(ORGANIZATION_TIERS_INFO.keys());

export function getOrganizationTierInfo(tier: OrganizationTier) {
  return ORGANIZATION_TIERS_INFO.get(tier)!;
}
