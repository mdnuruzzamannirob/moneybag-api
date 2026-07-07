import type { Response } from 'express';
import crypto from 'node:crypto';
import { isProduction } from '../config/env.js';

export const ACCESS_COOKIE = 'accessToken';
export const REFRESH_COOKIE = 'refreshToken';
export const CSRF_COOKIE = 'XSRF-TOKEN';

const FIFTEEN_MINUTES_MS = 2 * 60 * 1000;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

// Cookie attributes shared by all auth cookies.
const baseCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax' as const,
  path: '/',
};

// CSRF token is intentionally NOT httpOnly because the SPA needs to
// read it to echo it in a header. We still mark it secure + sameSite.
const baseCsrfCookieOptions = {
  httpOnly: false,
  secure: isProduction,
  sameSite: 'lax' as const,
  path: '/',
};

// Read the optional COOKIE_DOMAIN from env (typed loosely so we don't have
// to expand the env schema for this single optional knob).
const envRecord = process.env as Record<string, string | undefined>;
const COOKIE_DOMAIN = envRecord.COOKIE_DOMAIN;

const withDomain = <T extends Record<string, unknown>>(opts: T): T => {
  return COOKIE_DOMAIN ? ({ ...opts, domain: COOKIE_DOMAIN } as T) : opts;
};

export const setAuthCookies = (
  res: Response,
  tokens: { accessToken: string; refreshToken: string },
) => {
  res.cookie(
    ACCESS_COOKIE,
    tokens.accessToken,
    withDomain({
      ...baseCookieOptions,
      maxAge: FIFTEEN_MINUTES_MS,
    }),
  );
  res.cookie(
    REFRESH_COOKIE,
    tokens.refreshToken,
    withDomain({
      ...baseCookieOptions,
      maxAge: SEVEN_DAYS_MS,
    }),
  );
  ensureCsrfCookie(res);
};

export const clearAuthCookies = (res: Response) => {
  res.clearCookie(ACCESS_COOKIE, withDomain({ ...baseCookieOptions }));
  res.clearCookie(REFRESH_COOKIE, withDomain({ ...baseCookieOptions }));
  // Clear the CSRF cookie too. Use a non-httpOnly config because the
  // existing one was set without httpOnly.
  res.clearCookie(CSRF_COOKIE, withDomain({ ...baseCsrfCookieOptions }));
};

export const ensureCsrfCookie = (res: Response) => {
  const existing = (res.req as { cookies?: Record<string, string> })?.cookies?.[
    CSRF_COOKIE
  ];
  if (existing) return;
  const token = crypto.randomBytes(32).toString('hex');
  res.cookie(
    CSRF_COOKIE,
    token,
    withDomain({
      ...baseCsrfCookieOptions,
      // CSRF cookie should outlive the access token so the SPA always
      // has a token to echo. We don't set maxAge to make it a session
      // cookie that the browser clears when closed.
    }),
  );
};
