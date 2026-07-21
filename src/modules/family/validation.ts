import { z } from 'zod';

const familyRoleSchema = z
  .enum(['viewer', 'editor', 'VIEWER', 'EDITOR'])
  .transform((role) => role.toUpperCase() as 'VIEWER' | 'EDITOR');

const parseableDateSchema = z.string().refine(
  (value) => !Number.isNaN(Date.parse(value)),
  'Must be a valid ISO date',
);

const listGroupsQuerySchema = z
  .object({
    search: z.string().trim().min(1).max(100).optional(),
    page: z.coerce.number().int().positive().max(1_000_000).optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
  })
  .strict()
  .optional()
  .transform((query) => ({
    search: query?.search,
    page: query?.page ?? 1,
    limit: query?.limit ?? 20,
  }));

const transactionQuerySchema = z
  .object({
    type: z.enum(['INCOME', 'EXPENSE']).optional(),
    category: z.string().uuid().optional(),
    from: parseableDateSchema.optional(),
    to: parseableDateSchema.optional(),
    tag: z.string().trim().min(1).max(100).optional(),
    search: z.string().trim().min(1).max(200).optional(),
    page: z.coerce.number().int().positive().max(1_000_000).optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    sortBy: z.enum(['date', 'amount', 'createdAt']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  })
  .strict()
  .superRefine((query, context) => {
    if (
      query.from &&
      query.to &&
      Date.parse(query.from) > Date.parse(query.to)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['to'],
        message: 'Must be on or after from',
      });
    }
  })
  .optional()
  .transform((query) => ({
    ...query,
    page: query?.page ?? 1,
    limit: query?.limit ?? 20,
    sortBy: query?.sortBy ?? ('date' as const),
    sortOrder: query?.sortOrder ?? ('desc' as const),
  }));

export const listGroupsSchema = z
  .object({ query: listGroupsQuerySchema })
  .passthrough();

export const createGroupSchema = z
  .object({
    body: z
      .object({
        name: z.string().trim().min(1).max(100),
      })
      .strict(),
  })
  .passthrough();

export const inviteMemberSchema = z
  .object({
    params: z.object({ id: z.string().uuid() }).strict(),
    body: z
      .object({
        email: z.string().trim().toLowerCase().email().max(320),
        role: familyRoleSchema.default('VIEWER'),
      })
      .strict(),
  })
  .passthrough();

export const acceptInvitationSchema = z
  .object({
    params: z
      .object({ token: z.string().trim().min(32).max(256) })
      .strict(),
  })
  .passthrough();

export const removeMemberSchema = z
  .object({
    params: z
      .object({
        id: z.string().uuid(),
        userId: z.string().uuid(),
      })
      .strict(),
  })
  .passthrough();

export const groupTransactionsSchema = z
  .object({
    params: z.object({ id: z.string().uuid() }).strict(),
    query: transactionQuerySchema,
  })
  .passthrough();
