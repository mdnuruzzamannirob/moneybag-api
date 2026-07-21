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
        name: z.string().trim().min(1).max(100),
        type: typeSchema,
        icon: z.string().trim().max(100).optional(),
        color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
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
