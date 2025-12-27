import { z } from 'zod';

export const periodSchema = z.object({
  start: z.date(),
  end: z.date(),
});

export type Period = z.infer<typeof periodSchema>;
