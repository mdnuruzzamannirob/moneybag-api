import { z } from 'zod';

const planSlugSchema = z.enum(['pro-monthly', 'pro-yearly', 'unlimited']);

export const checkoutSchema = z
  .object({
    body: z
      .object({
        planId: z.string().uuid().optional(),
        planSlug: planSlugSchema.optional(),
      })
      .strict()
      .refine((body) => Boolean(body.planId) !== Boolean(body.planSlug), {
        message: 'Provide exactly one of planId or planSlug',
      }),
  })
  .passthrough();
