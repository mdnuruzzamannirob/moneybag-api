import { z } from 'zod';

export const createSavingsGoalSchema = z.object({
  body: z
    .object({
      title: z.string().trim().min(1).max(150),
      targetAmount: z.coerce.number().finite().positive(),
      deadline: z.coerce.date(),
    })
    .strict(),
});

export const contributeSchema = z.object({
  params: z.object({ id: z.string().uuid() }).strict(),
  body: z
    .object({
      amount: z.coerce.number().finite().positive(),
      date: z.coerce.date().default(() => new Date()),
      note: z.string().trim().max(500).optional(),
    })
    .strict(),
});

export const idParamSchema = z.object({
  params: z.object({ id: z.string().uuid() }).strict(),
});

export const listSavingsGoalsSchema = z.object({
  query: z
    .object({
      search: z.string().trim().min(1).max(150).optional(),
      page: z.coerce.number().int().positive().default(1),
      limit: z.coerce.number().int().positive().max(100).default(20),
    })
    .strict(),
});
