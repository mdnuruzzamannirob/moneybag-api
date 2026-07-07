import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env.js';
import { Prisma } from '../generated/prisma/client.js';
import { AppError } from '../utils/response.js';

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new AppError(404, `Route ${req.method} ${req.originalUrl} not found`));
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: error.issues,
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P1000') {
      return res.status(500).json({
        success: false,
        message: 'Database authentication failed.',
        code: error.code,
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Database request failed',
      code: error.code,
    });
  }

  const statusCode = error instanceof AppError ? error.statusCode : 500;
  const message = error instanceof AppError ? error.message : 'Internal server error';

  return res.status(statusCode).json({
    success: false,
    message,
    ...(env.NODE_ENV !== 'production' && error instanceof Error ? { stack: error.stack } : {}),
  });
};
