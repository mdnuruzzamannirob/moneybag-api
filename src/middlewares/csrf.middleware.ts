import type { NextFunction, Request, Response } from 'express';
import { CSRF_COOKIE, ensureCsrfCookie } from '../utils/cookies.js';
import { AppError } from '../utils/response.js';

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const CSRF_SAFE_PREFIXES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/google',
  '/api/auth/logout',
  '/api/billing/webhook',
];

export const csrfProtection = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  ensureCsrfCookie(res);

  if (!UNSAFE_METHODS.has(req.method)) {
    return next();
  }

  // Bearer tokens are explicit, non-ambient credentials and are not vulnerable
  // to browser CSRF. Cookie-authenticated mutations still require double-submit.
  if (req.headers.authorization?.startsWith('Bearer ')) {
    return next();
  }

  const isSafe = CSRF_SAFE_PREFIXES.some(
    (prefix) => req.path === prefix || req.path.startsWith(`${prefix}/`),
  );
  if (isSafe) {
    return next();
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const headerToken =
    (req.headers['x-xsrf-token'] as string | undefined) ??
    (req.headers['csrf-token'] as string | undefined);

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return next(
      new AppError(403, 'Invalid CSRF token. Please refresh and try again.'),
    );
  }

  next();
};
