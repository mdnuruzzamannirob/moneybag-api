import { z } from 'zod';

const uuidParams = z.object({ id: z.string().uuid() }).strict();
const pagination = {
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
};

const queryBoolean = z.preprocess((value) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}, z.boolean());

const subscriptionStatus = z.enum([
  'ACTIVE',
  'PAST_DUE',
  'CANCELED',
  'TRIALING',
  'INCOMPLETE',
  'LIFETIME',
]);

const planLimitsSchema = z
  .object({
    maxTransactions: z.number().int().nonnegative().nullable().optional(),
    maxBudgets: z.number().int().nonnegative().nullable().optional(),
    maxSavingsGoals: z.number().int().nonnegative().nullable().optional(),
    csvImport: z.boolean().optional(),
    receiptUpload: z.boolean().optional(),
    familySharing: z.boolean().optional(),
    maxFamilyMembers: z.number().int().nonnegative().max(5).optional(),
    fullReports: z.boolean().optional(),
    maxStorageMb: z.number().int().nonnegative().nullable().optional(),
  })
  .strict();

const moneySchema = z.union([
  z.number().finite().nonnegative().max(99_999_999.99).multipleOf(0.01),
  z
    .string()
    .trim()
    .regex(/^\d{1,8}(?:\.\d{1,2})?$/, 'Must be a non-negative amount'),
]);

const planFields = z.object({
  name: z.string().trim().min(1).max(100),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Must be a lowercase slug'),
  description: z.string().trim().max(1_000).nullable().optional(),
  price: moneySchema,
  interval: z.enum(['monthly', 'yearly', 'lifetime']),
  limits: planLimitsSchema,
  stripePriceId: z.string().trim().min(1).max(255).nullable().optional(),
  isActive: z.boolean().optional(),
});

const categoryFields = z.object({
  name: z.string().trim().min(1).max(100),
  type: z.enum(['INCOME', 'EXPENSE']),
  icon: z.string().trim().max(100).nullable().optional(),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Must be a six-digit hex colour')
    .nullable()
    .optional(),
});

export const idParamSchema = z
  .object({
    params: uuidParams,
  })
  .passthrough();

export const listUsersSchema = z
  .object({
    query: z
      .object({
        search: z.string().trim().min(1).max(255).optional(),
        role: z.enum(['USER', 'ADMIN']).optional(),
        isActive: queryBoolean.optional(),
        status: z
          .enum(['active', 'inactive', 'ACTIVE', 'INACTIVE'])
          .transform((value) => value.toLowerCase() === 'active')
          .optional(),
        planId: z.string().uuid().optional(),
        plan: z.string().trim().min(1).max(100).optional(),
        subscriptionStatus: subscriptionStatus.optional(),
        sortBy: z
          .enum(['createdAt', 'name', 'email', 'lastLoginAt'])
          .default('createdAt'),
        sortOrder: z.enum(['asc', 'desc']).default('desc'),
        ...pagination,
      })
      .strict()
      .default({
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }),
  })
  .passthrough();

export const userStatusSchema = z
  .object({
    params: uuidParams,
    body: z.object({ isActive: z.boolean() }).strict(),
  })
  .passthrough();

export const assignPlanSchema = z
  .object({
    params: uuidParams,
    body: z.object({ planId: z.string().uuid() }).strict(),
  })
  .passthrough();

export const listSubscriptionsSchema = z
  .object({
    query: z
      .object({
        search: z.string().trim().min(1).max(255).optional(),
        status: subscriptionStatus.optional(),
        planId: z.string().uuid().optional(),
        plan: z.string().trim().min(1).max(100).optional(),
        cancelAtPeriodEnd: queryBoolean.optional(),
        sortBy: z
          .enum(['createdAt', 'updatedAt', 'currentPeriodEnd', 'status'])
          .default('createdAt'),
        sortOrder: z.enum(['asc', 'desc']).default('desc'),
        ...pagination,
      })
      .strict()
      .default({
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }),
  })
  .passthrough();

export const refundSubscriptionSchema = z
  .object({
    params: uuidParams,
    body: z
      .object({
        amount: z.coerce
          .number()
          .finite()
          .positive()
          .max(99_999_999.99)
          .multipleOf(0.01)
          .optional(),
        reason: z
          .enum(['duplicate', 'fraudulent', 'requested_by_customer'])
          .default('requested_by_customer'),
      })
      .strict()
      .default({ reason: 'requested_by_customer' }),
  })
  .passthrough();

export const cancelSubscriptionSchema = z
  .object({
    params: uuidParams,
    body: z
      .object({
        atPeriodEnd: z.boolean().default(false),
      })
      .strict()
      .default({ atPeriodEnd: false }),
  })
  .passthrough();

export const listPlansSchema = z
  .object({
    query: z
      .object({
        search: z.string().trim().min(1).max(255).optional(),
        isActive: queryBoolean.optional(),
        interval: z.enum(['monthly', 'yearly', 'lifetime']).optional(),
        ...pagination,
      })
      .strict()
      .default({ page: 1, limit: 20 }),
  })
  .passthrough();

export const createPlanSchema = z
  .object({
    body: planFields.strict(),
  })
  .passthrough();

export const updatePlanSchema = z
  .object({
    params: uuidParams,
    body: planFields
      .partial()
      .strict()
      .refine((value) => Object.keys(value).length > 0, {
        message: 'At least one plan field is required',
      }),
  })
  .passthrough();

export const listGlobalCategoriesSchema = z
  .object({
    query: z
      .object({
        search: z.string().trim().min(1).max(255).optional(),
        type: z.enum(['INCOME', 'EXPENSE']).optional(),
        ...pagination,
      })
      .strict()
      .default({ page: 1, limit: 20 }),
  })
  .passthrough();

export const createGlobalCategorySchema = z
  .object({
    body: categoryFields.strict(),
  })
  .passthrough();

export const updateGlobalCategorySchema = z
  .object({
    params: uuidParams,
    body: categoryFields
      .partial()
      .strict()
      .refine((value) => Object.keys(value).length > 0, {
        message: 'At least one category field is required',
      }),
  })
  .passthrough();

export const listAuditLogsSchema = z
  .object({
    query: z
      .object({
        search: z.string().trim().min(1).max(255).optional(),
        userId: z.string().uuid().optional(),
        action: z.string().trim().min(1).max(255).optional(),
        from: z.coerce.date().optional(),
        to: z.coerce.date().optional(),
        ...pagination,
      })
      .strict()
      .refine((value) => !value.from || !value.to || value.from <= value.to, {
        message: '`from` must be before or equal to `to`',
        path: ['from'],
      })
      .default({ page: 1, limit: 20 }),
  })
  .passthrough();

export const listEmailTemplatesSchema = z
  .object({
    query: z
      .object({
        search: z.string().trim().min(1).max(255).optional(),
        ...pagination,
      })
      .strict()
      .default({ page: 1, limit: 20 }),
  })
  .passthrough();

export const updateEmailTemplateSchema = z
  .object({
    params: uuidParams,
    body: z
      .object({
        subject: z.string().trim().min(1).max(255).optional(),
        body: z.string().min(1).max(100_000).optional(),
      })
      .strict()
      .refine((value) => Object.keys(value).length > 0, {
        message: 'At least one template field is required',
      }),
  })
  .passthrough();

const settingKey = z.string().trim().min(1).max(100);
const settingsRecord = z
  .record(settingKey, z.json())
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one setting is required',
  });

export const updateSettingsSchema = z
  .object({
    body: z.union([
      z
        .object({ key: settingKey, value: z.json() })
        .strict()
        .transform(({ key, value }) => ({ [key]: value })),
      z
        .object({ settings: settingsRecord })
        .strict()
        .transform(({ settings }) => settings),
      settingsRecord,
    ]),
  })
  .passthrough();
