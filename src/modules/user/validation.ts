import { z } from 'zod';

export const updateProfileSchema = z
  .object({
    body: z
      .object({
        name: z.string().min(2).optional(),
        currency: z.string().min(3).max(3).optional(),
      })
      .strict(),
  })
  .passthrough();

export const changePasswordSchema = z
  .object({
    body: z
      .object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(8),
      })
      .strict(),
  })
  .passthrough();
