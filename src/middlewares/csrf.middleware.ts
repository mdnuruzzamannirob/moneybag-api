import type { NextFunction, Request, Response } from 'express';
import { CSRF_COOKIE, ensureCsrfCookie } from '../utils/cookies.js';
import { AppError } from '../utils/response.js';

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

// Endpoints that perform the initial login/register. CSRF tokens can't
// exist yet (no session), so we skip the check there and just ensure a
// CSRF cookie is set in the response.
const CSRF_SAFE_PREFIXES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
];

/**
 * CSRF protection using the double-submit cookie pattern.
 *
 *   - Server sets a non-httpOnly cookie `XSRF-TOKEN` on login/register.
 *   - SPA reads the cookie and echoes it in the `X-XSRF-TOKEN` header.
 *   - This middleware verifies the two values match on mutating requests.
 *
 * Safe methods (GET, HEAD, OPTIONS) and explicit auth bootstrap endpoints
 * bypass the check (so login still works without an existing token).
 */
export const csrfProtection = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Always make sure a CSRF cookie is set on authed responses.
  ensureCsrfCookie(res);

  if (!UNSAFE_METHODS.has(req.method)) {
    return next();
  }

  // Allow auth bootstrap endpoints to proceed without a CSRF token.
  const isSafe = CSRF_SAFE_PREFIXES.some(
    (prefix) => req.path === prefix || req.path.startsWith(`${prefix}/`),
  );
  if (isSafe) {
    return next();
  }

  const cookieToken = (req.cookies as Record<string, string> | undefined)?.[
    CSRF_COOKIE
  ];
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
