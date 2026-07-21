import * as Sentry from '@sentry/node';
import { env } from './env.js';

let initialized = false;

export const initializeMonitoring = () => {
  if (!env.SENTRY_DSN || initialized) return;
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    sendDefaultPii: false,
  });
  initialized = true;
};

export const captureException = (error: unknown) => {
  if (initialized) Sentry.captureException(error);
};
