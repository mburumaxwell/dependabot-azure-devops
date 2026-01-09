'use server';

import { headers as requestHeaders } from 'next/headers';
import { auth, BetterAuthApiError } from '@/lib/auth';
import { storeFeedback } from './feedback';

export type DeleteUserOptions = {
  feedback?: string;
};

/**
 * Request synchronization for a project or repository.
 * @param options The synchronization options.
 */
export async function deleteUser({ feedback }: DeleteUserOptions) {
  const headers = await requestHeaders();
  const user = (await auth.api.getSession({ headers }))!.user!; // definitely there if we're deleting

  try {
    await auth.api.deleteUser({
      headers,
      body: { callbackURL: '/login' },
    });
  } catch (error) {
    if (error instanceof BetterAuthApiError && error.body) {
      const { code, message } = error.body;
      return { success: false, error: { message: message || code! } };
    }
    return { success: false, error: { message: `Unable to delete user.\n${(error as Error).message}` } };
  }

  // collect the feedback, if provided
  if (feedback) {
    await storeFeedback({
      // use the user ID to avoid duplicates because delete requires email confirmation (i.e. 2 step)
      deduplicationId: `delete_${user.id}`,
      type: 'user.delete',
      message: feedback,
      metadata: { userId: user.id },
    });
  }

  return { success: true };
}
