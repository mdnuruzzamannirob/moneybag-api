import { afterAll, beforeAll, beforeEach, expect, vi } from 'vitest';
import { config as loadEnv } from 'dotenv';
import type { NextFunction, Request, Response } from 'express';

loadEnv({ path: '.env.test', quiet: true });
loadEnv({ path: '.env', override: false, quiet: true });

process.env.NODE_ENV = 'test';
process.env.PORT ??= '5001';
process.env.REDIS_URL ??= 'redis://localhost:6379';

vi.mock('../src/middlewares/rateLimiter.js', () => ({
  apiRateLimiter: (_req: Request, _res: Response, next: NextFunction) => next(),
  authRateLimiter: (_req: Request, _res: Response, next: NextFunction) =>
    next(),
}));

vi.mock('../src/utils/mailer.js', () => ({
  sendMail: vi.fn<() => Promise<void>>().mockResolvedValue(undefined as void),
  sendTemplateMail: vi
    .fn<() => Promise<void>>()
    .mockResolvedValue(undefined as void),
}));

let prismaAvailable = false;
let redisAvailable = false;
let prisma: typeof import('../src/config/db.js').prisma | undefined;
let redis: typeof import('../src/config/redis.js').redis | undefined;

const isIntegrationTest = () => {
  const testPath = expect.getState().testPath ?? '';
  return /[\\/]integration[\\/]/.test(testPath);
};

beforeAll(async () => {
  if (!isIntegrationTest()) {
    return;
  }

  const db = await import('../src/config/db.js');
  const redisConfig = await import('../src/config/redis.js');
  prisma = db.prisma;
  redis = redisConfig.redis;

  try {
    await prisma.$connect();
    prismaAvailable = true;
  } catch (err) {
    console.error('Failed to connect to Prisma:', err);
  }

  try {
    if (redis.status === 'wait' || redis.status === 'end') {
      await redis.connect();
    }
    redisAvailable = true;
  } catch (err) {
    console.error('Failed to connect to Redis:', err);
  }
});

afterAll(async () => {
  if (!isIntegrationTest()) {
    return;
  }

  try {
    await prisma?.$disconnect();
  } catch (err) {
    console.error('Failed to disconnect Prisma:', err);
  }

  try {
    await redis?.quit();
  } catch (err) {
    console.error('Failed to disconnect Redis:', err);
  }
});

beforeEach(async () => {
  if (!isIntegrationTest()) {
    return;
  }

  if (!prismaAvailable && !redisAvailable) {
    return;
  }

  if (prismaAvailable && prisma) {
    try {
      const tablenames = await prisma.$queryRaw<Array<{ tablename: string }>>`
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public' AND tablename != '_prisma_migrations';
      `;

      const quoted = tablenames
        .map(({ tablename }) => `"public"."${tablename.replaceAll('"', '""')}"`)
        .join(', ');
      if (quoted) {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${quoted} CASCADE;`);
      }
    } catch (err) {
      console.error('Failed to truncate tables:', err);
    }
  }

  if (redisAvailable && redis) {
    try {
      await redis.flushdb();
    } catch (err) {
      console.error('Failed to flush Redis:', err);
    }
  }
});
