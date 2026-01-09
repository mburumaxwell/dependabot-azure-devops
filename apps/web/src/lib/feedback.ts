import { z } from 'zod';

export const FeedbackTypeSchema = z.enum(['docs.review', 'organization.leave', 'user.delete', 'billing.cancel']);
export type FeedbackType = z.infer<typeof FeedbackTypeSchema>;

export const FeedbackOpinionSchema = z.enum(['good', 'bad']);
export type FeedbackOpinion = z.infer<typeof FeedbackOpinionSchema>;

export const SubmitFeedbackSchema = z.object({
  opinion: FeedbackOpinionSchema,
  url: z.string(),
  message: z.string(),
});

export const SubmitFeedbackResponseSchema = z.object({
  url: z.url().optional(),
});

export type SubmitFeedback = z.infer<typeof SubmitFeedbackSchema>;
export type SubmitFeedbackResponse = z.infer<typeof SubmitFeedbackResponseSchema>;
