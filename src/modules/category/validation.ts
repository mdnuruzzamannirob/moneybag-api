import { z } from 'zod';

const typeSchema = z.enum(['INCOME', 'EXPENSE']);

export const listCategoriesSchema = z
  .object({
    query: z
      .object({
        search: z.string().trim().min(1).optional(),
        type: typeSchema.optional(),
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(100).default(20),
      })
      .strict(),
  })
  .passthrough();

export const createCategorySchema = z
  .object({
    body: z
      .object({
        name: z.string().min(1),
        type: typeSchema,
        icon: z.string().optional(),
        color: z.string().optional(),
      })
      .strict(),
  })
  .passthrough();

export const updateCategorySchema = z
  .object({
    params: z.object({ id: z.string().uuid() }),
    body: createCategorySchema.shape.body.partial(),
  })
  .passthrough();

export const idParamSchema = z
  .object({
    params: z.object({ id: z.string().uuid() }),
  })
  .passthrough();
