'use server';

import { PakloId } from '@/lib/paklo-id';
import { type Feedback, prisma } from '@/lib/prisma';

export type StoreFeedbackOptions = Pick<Feedback, 'message' | 'action'> & {
  /**
   * The ID of the feedback (optional).
   * Only use this if you are sure it won't change and you need it to replace an existing entry.
   * If not provided, a new ID will be generated.
   */
  id?: string;
  metadata?: Record<string, unknown>;
};

/**
 * Store feedback from a user about something.
 * @param options The feedback options.
 */
export async function storeFeedback(options: StoreFeedbackOptions) {
  const { id = PakloId.generateKidOnly(), action, message, metadata } = options;

  // store in the database
  // this might change in the future to be sent to an external service
  try {
    await prisma.feedback.create({
      data: {
        id,
        action,
        message,
        metadata: metadata ? JSON.stringify(metadata) : undefined,
      },
    });
  } catch (_error) {
    // ignore feedback errors
  }
}
