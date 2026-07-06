import { z } from 'zod';

const txnType = z.enum(['INCOME', 'EXPENSE']);
const recurringRule = z.enum(['DAILY', 'WEEKLY', 'MONTHLY']);

export const listTransactionsSchema = z
  .object({
    query: z
      .object({
        type: txnType.optional(),
        category: z.string().uuid().optional(),
        from: z.string().datetime().optional(),
        to: z.string().datetime().optional(),
        tag: z.string().optional(),
        search: z.string().trim().min(1).optional(),
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(100).default(20),
        sortBy: z.enum(['date', 'amount', 'createdAt']).default('date'),
        sortOrder: z.enum(['asc', 'desc']).default('desc'),
      })
      .strict(),
  })
  .passthrough();

export const createTransactionSchema = z
  .object({
    body: z
      .object({
        amount: z.number().positive(),
        type: txnType,
        categoryId: z.string().uuid(),
        note: z.string().optional(),
        date: z.coerce.date(),
        tags: z.array(z.string()).default([]),
        receiptUrl: z.string().url().optional(),
        isRecurring: z.boolean().default(false),
        recurringRule: recurringRule.optional(),
      })
      .strict(),
  })
  .passthrough();

export const updateTransactionSchema = z
  .object({
    params: z.object({ id: z.string().uuid() }),
    body: createTransactionSchema.shape.body.partial(),
  })
  .passthrough();

export const idParamSchema = z
  .object({ params: z.object({ id: z.string().uuid() }).strict() })
  .passthrough();
