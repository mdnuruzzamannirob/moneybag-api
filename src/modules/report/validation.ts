import { z } from 'zod';

export const monthlySchema = z.object({
  query: z
    .object({
      month: z.coerce.number().int().min(1).max(12),
      year: z.coerce.number().int().min(1970).max(3000),
    })
    .strict(),
});

export const yearlySchema = z.object({
  query: z.object({ year: z.coerce.number().int().min(1970).max(3000) }).strict(),
});

export const trendSchema = z.object({
  query: z
    .object({ from: z.coerce.date(), to: z.coerce.date() })
    .strict()
    .refine((value) => value.from <= value.to, {
      message: 'from must be before or equal to to',
      path: ['to'],
    })
    .refine((value) => value.to.getTime() - value.from.getTime() <= 366 * 86400000, {
      message: 'Trend range cannot exceed 366 days',
      path: ['to'],
    }),
});

export const exportSchema = z.object({
  query: z
    .object({
      type: z.enum(['pdf', 'csv']),
      month: z.coerce.number().int().min(1).max(12),
      year: z.coerce.number().int().min(1970).max(3000),
    })
    .strict(),
});
