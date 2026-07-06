import { z } from 'zod';

export const listUsersSchema = z
  .object({
    query: z
      .object({
        search: z.string().trim().min(1).optional(),
        role: z.enum(['USER', 'ADMIN']).optional(),
        isActive: z.coerce.boolean().optional(),
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(100).default(20),
      })
      .strict()
      .default({ page: 1, limit: 20 }),
  })
  .passthrough();

export const userStatusSchema = z
  .object({
    params: z.object({ id: z.string().uuid() }).strict(),
    body: z.object({ isActive: z.boolean() }).strict(),
  })
  .passthrough();
