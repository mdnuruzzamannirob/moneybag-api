import { z } from 'zod';

const booleanQuerySchema = z
  .union([z.boolean(), z.enum(['true', 'false'])])
  .transform((value) => value === true || value === 'true');

const listQuerySchema = z
  .object({
    type: z.enum(['BUDGET_ALERT', 'SUBSCRIPTION', 'SYSTEM']).optional(),
    unreadOnly: booleanQuerySchema.optional(),
    page: z.coerce.number().int().positive().max(1_000_000).optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
  })
  .strict()
  .optional()
  .transform((query) => ({
    type: query?.type,
    unreadOnly: query?.unreadOnly ?? false,
    page: query?.page ?? 1,
    limit: query?.limit ?? 20,
  }));

export const listNotificationsSchema = z
  .object({ query: listQuerySchema })
  .passthrough();

export const notificationIdSchema = z
  .object({
    params: z.object({ id: z.string().uuid() }).strict(),
  })
  .passthrough();

export const emptyMutationSchema = z
  .object({
    body: z.object({}).strict(),
  })
  .passthrough();
