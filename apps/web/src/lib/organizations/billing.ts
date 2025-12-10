import { z } from 'zod';

export const OrganizationBillingIntervalSchema = z.enum(['monthly', 'yearly']);
