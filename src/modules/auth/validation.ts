import { z } from 'zod';

const password = z.string().min(8).max(72);

export const registerSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(2).max(100),
      email: z.string().trim().email().toLowerCase(),
      password,
      currency: z
        .string()
        .trim()
        .length(3)
        .transform((value) => value.toUpperCase())
        .default('USD'),
    })
    .strict(),
});

export const loginSchema = z.object({
  body: z
    .object({
      email: z.string().trim().email().toLowerCase(),
      password: z.string().min(1).max(72),
    })
    .strict(),
});

const tokenBodySchema = z.object({
  body: z
    .object({
      refreshToken: z.string().min(1).optional(),
    })
    .strict(),
});

export const refreshSchema = tokenBodySchema;
export const logoutSchema = tokenBodySchema;

export const googleSchema = z.object({
  body: z.object({ credential: z.string().min(20) }).strict(),
});

export const forgotPasswordSchema = z.object({
  body: z.object({ email: z.string().trim().email().toLowerCase() }).strict(),
});

export const resetPasswordSchema = z.object({
  body: z
    .object({
      token: z.string().min(32),
      password,
    })
    .strict(),
});
