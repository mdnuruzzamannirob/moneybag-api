import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../config/db.js';
import { ACCESS_COOKIE } from '../utils/cookies.js';
import { verifyAccessToken } from '../utils/jwt.js';
import { AppError } from '../utils/response.js';

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const header = req.headers.authorization;
  const headerToken = header?.startsWith('Bearer ')
    ? header.slice(7)
    : undefined;
  const cookieToken = (req.cookies as Record<string, string> | undefined)?.[
    ACCESS_COOKIE
  ];
  const token = cookieToken || headerToken;

  if (!token) {
    return next(new AppError(401, 'Authentication token is required'));
  }

  try {
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return next(new AppError(401, 'User is inactive or no longer exists'));
    }

    req.user = { id: user.id, email: user.email, role: user.role };
    next();
  } catch {
    next(new AppError(401, 'Invalid or expired authentication token'));
  }
};

export const authorize =
  (...roles: string[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, 'Authentication is required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(403, 'You do not have permission to access this resource'),
      );
    }

    next();
  };
