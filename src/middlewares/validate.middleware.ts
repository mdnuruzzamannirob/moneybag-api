import { sendResponse } from '@/utils/response.js';
import type { NextFunction, Request, Response } from 'express';
import type { ZodError, ZodTypeAny } from 'zod';

export const validate =
  (schema: ZodTypeAny) => (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse({
      body: req.body ?? {},
      ...(Object.keys(req.params ?? {}).length ? { params: req.params } : {}),
      ...(Object.keys(req.query ?? {}).length ? { query: req.query } : {}),
    });

    if (!parsed.success) {
      const zodError = parsed.error as ZodError;
      const first = zodError.issues[0];
      const path = first?.path?.join('.') || 'input';
      const message = first ? `${path}: ${first.message}` : 'Validation failed';
      return sendResponse(
        res,
        400,
        message,
        undefined,
        undefined,
        zodError.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      );
    }
    const data = parsed.data as Record<string, unknown>;
    if ('body' in data) req.body = data.body as Request['body'];
    if ('params' in data) req.params = data.params as Request['params'];
    res.locals.validated = {
      ...res.locals.validated,
      ...(data.body ? { body: data.body } : {}),
      ...(data.params ? { params: data.params } : {}),
      ...(data.query ? { query: data.query } : {}),
    };
    next();
  };
