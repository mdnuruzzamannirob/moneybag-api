import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(2).max(100).optional(),
      currency: z
        .string()
        .trim()
        .length(3)
        .transform((value) => value.toUpperCase())
        .optional(),
      theme: z.enum(['light', 'dark', 'system']).optional(),
      avatarUrl: z.string().url().nullable().optional(),
      notificationPreferences: z
        .object({
          emailBudgetAlerts: z.boolean().optional(),
          inAppBudgetAlerts: z.boolean().optional(),
          subscriptionEmails: z.boolean().optional(),
        })
        .strict()
        .optional(),
    })
    .strict()
    .refine((value) => Object.keys(value).length > 0, 'No changes supplied'),
});

export const changePasswordSchema = z.object({
  body: z
    .object({
      currentPassword: z.string().min(1).max(72),
      newPassword: z.string().min(8).max(72),
    })
    .strict(),
});

export const exportDataSchema = z.object({
  query: z.object({ format: z.enum(['json', 'csv']).default('json') }).strict(),
});

export const deleteAccountSchema = z.object({
  body: z.object({ password: z.string().max(72).optional() }).strict().default({}),
});
