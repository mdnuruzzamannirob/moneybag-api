import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../config/db.js';
import { AppError } from '../utils/response.js';

const BYPASS_PREFIXES = ['/health', '/api/docs', '/api/admin', '/api/billing/webhook'];
let cached: { enabled: boolean; expiresAt: number } | undefined;

export const maintenanceMode = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  if (BYPASS_PREFIXES.some((prefix) => req.path.startsWith(prefix))) return next();
  try {
    if (!cached || cached.expiresAt <= Date.now()) {
      const setting = await prisma.globalSetting.findUnique({
        where: { key: 'maintenanceMode' },
      });
      cached = {
        enabled: setting?.value === true,
        expiresAt: Date.now() + 10_000,
      };
    }
    if (cached.enabled) {
      return next(new AppError(503, 'MoneyBag is temporarily under maintenance'));
    }
  } catch {
    // Database errors are reported by the actual request handler.
  }
  next();
};

export const clearMaintenanceCache = () => {
  cached = undefined;
};
