'use server';

import type { FeedbackType, SubmitFeedback, SubmitFeedbackResponse } from '@/lib/feedback';
import { PakloId } from '@/lib/ids';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

export type StoreFeedbackOptions = Partial<SubmitFeedback> & {
  /** Optional ID for deduplication */
  deduplicationId?: string;
  type: FeedbackType;
  metadata?: Record<string, unknown>;
};

/**
 * Store feedback from a user about something.
 * @param options The feedback options.
 */
export async function storeFeedback(options: StoreFeedbackOptions): Promise<SubmitFeedbackResponse> {
  const { deduplicationId, ...remaining } = options;

  try {
    const id = deduplicationId ?? PakloId.generateKidOnly();
    await prisma.feedback.upsert({
      where: { id },
      create: { id, ...remaining },
      update: { ...remaining },
    });
    logger.trace(`Stored feedback id: ${id}`);
    // return { url: `https://www.paklo.app/feedback/${id}` };
    return {};
  } catch (error) {
    // discard feedback errors
    logger.error(error);
    return {};
  }
}
