import { z } from 'zod';

export const createBudgetSchema = z
  .object({
    body: z
      .object({
        limit: z.coerce.number().positive(),
        alertThreshold: z.coerce.number().int().min(1).max(100).default(80),
        month: z.coerce.number().int().min(1).max(12),
        year: z.number().int().min(1970),
        categoryId: z.string().uuid(),
      })
      .strict(),
  })
  .passthrough();

export const listBudgetSchema = z
  .object({
    query: z
      .object({
        month: z.coerce.number().int().min(1).max(12).optional(),
        year: z.coerce.number().int().min(1970).optional(),
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(100).default(20),
      })
      .strict(),
  })
  .passthrough();

export const updateBudgetSchema = z
  .object({
    params: z.object({ id: z.string().uuid() }),
    body: createBudgetSchema.shape.body.partial(),
  })
  .passthrough();
