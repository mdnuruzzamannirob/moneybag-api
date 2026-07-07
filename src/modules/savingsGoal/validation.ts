import { z } from 'zod';

export const createSavingsGoalSchema = z
  .object({
    body: z
      .object({
        title: z.string().min(1),
        targetAmount: z.number().positive(),
        deadline: z.string().datetime({ offset: true }),
      })
      .strict(),
  })
  .passthrough();

export const contributeSchema = z
  .object({
    params: z.object({ id: z.string().uuid() }),
    body: z.object({ amount: z.number().positive() }).strict(),
  })
  .passthrough();

export const idParamSchema = z
  .object({ params: z.object({ id: z.string().uuid() }).strict() })
  .passthrough();

export const listSavingsGoalsSchema = z
  .object({
    query: z
      .object({
        search: z.string().trim().min(1).optional(),
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(100).default(20),
      })
      .strict(),
  })
  .passthrough();
