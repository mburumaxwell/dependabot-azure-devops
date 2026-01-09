'use server';

import { headers as requestHeaders } from 'next/headers';
import { storeFeedback } from '@/actions/feedback';
import { auth, BetterAuthApiError } from '@/lib/auth';

export type OrganizationLeaveOptions = {
  organizationId: string;
  feedback?: string;
};

/**
 * Leave an organization.
 * @param options The options for leaving the organization.
 */
export async function leaveOrganization(
  options: OrganizationLeaveOptions,
): Promise<{ success: boolean; error?: { message: string } }> {
  const { organizationId, feedback } = options;
  const headers = await requestHeaders();
  try {
    await auth.api.leaveOrganization({
      headers,
      body: { organizationId },
    });
  } catch (error) {
    if (error instanceof BetterAuthApiError && error.body) {
      const { code, message } = error.body;
      return { success: false, error: { message: message || code! } };
    }
    return { success: false, error: { message: `Unable to leave organization.\n${(error as Error).message}` } };
  }

  // collect the feedback, if provided
  if (feedback) {
    await storeFeedback({
      type: 'organization.leave',
      message: feedback,
      metadata: { organizationId },
    });
  }

  return { success: true };
}
