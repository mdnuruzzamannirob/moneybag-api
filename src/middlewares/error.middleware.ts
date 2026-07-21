import type { ErrorRequestHandler, RequestHandler } from 'express';
import multer from 'multer';
import { ZodError } from 'zod';
import { env } from '../config/env.js';
import { captureException } from '../config/monitoring.js';
import { Prisma } from '../generated/prisma/client.js';
import { AppError, sendResponse } from '../utils/response.js';

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new AppError(404, `Route ${req.method} ${req.originalUrl} not found`));
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof multer.MulterError) {
    const message =
      error.code === 'LIMIT_FILE_SIZE'
        ? 'Uploaded file exceeds the allowed size'
        : error.message;
    return sendResponse(res, 413, message, undefined, undefined, {
      code: error.code,
    });
  }

  if (error instanceof ZodError) {
    return sendResponse(
      res,
      400,
      'Validation failed',
      undefined,
      undefined,
      error.issues,
    );
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P1000') {
      return sendResponse(
        res,
        500,
        'Database authentication failed.',
        undefined,
        undefined,
        {
          code: error.code,
        },
      );
    }

    if (error.code === 'P2025') {
      return sendResponse(res, 404, 'Record not found', undefined, undefined, {
        code: error.code,
      });
    }

    if (error.code === 'P2002') {
      const target = error.meta?.target;
      const field = Array.isArray(target) ? target.join(', ') : 'field';
      return sendResponse(
        res,
        409,
        `${field} already exists`,
        undefined,
        undefined,
        {
          code: error.code,
          meta: error.meta,
        },
      );
    }

    if (error.code === 'P2003') {
      return sendResponse(
        res,
        409,
        'Related record constraint failed',
        undefined,
        undefined,
        {
          code: error.code,
          meta: error.meta,
        },
      );
    }

    return sendResponse(
      res,
      400,
      'Database request failed',
      undefined,
      undefined,
      {
        code: error.code,
      },
    );
  }

  const statusCode = error instanceof AppError ? error.statusCode : 500;
  const message =
    error instanceof AppError ? error.message : 'Internal server error';

  if (statusCode >= 500) captureException(error);

  return res.status(statusCode).json({
    success: false,
    message,
    ...(error instanceof AppError && error.code ? { code: error.code } : {}),
    ...(error instanceof AppError && error.details !== undefined
      ? { errors: error.details }
      : {}),
    ...(env.NODE_ENV !== 'production' && error instanceof Error
      ? { stack: error.stack }
      : {}),
  });
};
