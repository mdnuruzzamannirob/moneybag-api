import { z } from 'zod';

const txnType = z.enum(['INCOME', 'EXPENSE']);
const recurringRule = z.enum(['DAILY', 'WEEKLY', 'MONTHLY']);

export const listTransactionsSchema = z.object({
  query: z
    .object({
      type: txnType.optional(),
      category: z.string().uuid().optional(),
      from: z.coerce.date().optional(),
      to: z.coerce.date().optional(),
      tag: z.string().trim().min(1).optional(),
      tags: z.string().trim().min(1).optional(),
      search: z.string().trim().min(1).max(200).optional(),
      page: z.coerce.number().int().positive().default(1),
      limit: z.coerce.number().int().positive().max(100).default(20),
      sortBy: z.enum(['date', 'amount', 'createdAt']).default('date'),
      sortOrder: z.enum(['asc', 'desc']).default('desc'),
    })
    .strict()
    .refine((query) => !query.from || !query.to || query.from <= query.to, {
      message: 'from must be before or equal to to',
      path: ['to'],
    }),
});

const transactionObject = z.object({
    amount: z.coerce.number().finite().positive().max(9_999_999_999.99),
    type: txnType,
    categoryId: z.string().uuid(),
    note: z.string().trim().max(500).optional(),
    date: z.coerce.date(),
    tags: z.array(z.string().trim().min(1).max(50)).max(20).default([]),
    isRecurring: z.boolean().default(false),
    recurringRule: recurringRule.nullable().optional(),
  }).strict();

const transactionBody = transactionObject.superRefine((value, context) => {
    if (value.isRecurring && !value.recurringRule) {
      context.addIssue({
        code: 'custom',
        message: 'recurringRule is required for recurring transactions',
        path: ['recurringRule'],
      });
    }
  });

export const createTransactionSchema = z.object({ body: transactionBody });

export const updateTransactionSchema = z.object({
  params: z.object({ id: z.string().uuid() }).strict(),
  body: transactionObject
    .partial()
    .refine((value) => Object.keys(value).length > 0, 'No changes supplied'),
});

export const idParamSchema = z.object({
  params: z.object({ id: z.string().uuid() }).strict(),
});
