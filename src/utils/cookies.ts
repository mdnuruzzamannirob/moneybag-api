import type { Response } from 'express';
import crypto from 'node:crypto';
import { isProduction } from '../config/env.js';

export const ACCESS_COOKIE = 'accessToken';
export const REFRESH_COOKIE = 'refreshToken';
export const CSRF_COOKIE = 'XSRF-TOKEN';

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const baseCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax' as const,
  path: '/',
};

const baseCsrfCookieOptions = {
  httpOnly: false,
  secure: isProduction,
  sameSite: 'lax' as const,
  path: '/',
};

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
  res.clearCookie(CSRF_COOKIE, withDomain({ ...baseCsrfCookieOptions }));
};

export const ensureCsrfCookie = (res: Response) => {
  const existing = (res.req as { cookies?: Record<string, string> })?.cookies?.[
    CSRF_COOKIE
  ];
  if (existing) return;
  const token = crypto.randomBytes(32).toString('hex');
  res.cookie(CSRF_COOKIE, token, withDomain({ ...baseCsrfCookieOptions }));
};
