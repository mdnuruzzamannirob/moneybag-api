import { z } from 'zod';

export const registerSchema = z
  .object({
    body: z
      .object({
        name: z.string().min(2),
        email: z.string().trim().email().toLowerCase(),
        password: z.string().min(8),
        currency: z.string().min(3).max(3).default('BDT'),
      })
      .strict(),
  })
  .passthrough();

export const loginSchema = z
  .object({
    body: z
      .object({
        email: z.string().trim().email().toLowerCase(),
        password: z.string().min(1),
      })
      .strict(),
  })
  .passthrough();

export const refreshSchema = z
  .object({
    body: z.object({ refreshToken: z.string().min(1) }).strict(),
  })
  .passthrough();

export const logoutSchema = refreshSchema;

export const forgotPasswordSchema = z
  .object({
    body: z.object({ email: z.string().trim().email().toLowerCase() }).strict(),
  })
  .passthrough();

export const resetPasswordSchema = z
  .object({
    body: z
      .object({
        token: z.string().min(1),
        password: z.string().min(8),
      })
      .strict(),
  })
  .passthrough();
