import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';
import { AppError } from '../utils/response.js';

export const validate =
  (schema: ZodTypeAny) => (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse({
      ...(Object.keys(req.body ?? {}).length ? { body: req.body } : {}),
      ...(Object.keys(req.params ?? {}).length ? { params: req.params } : {}),
      ...(Object.keys(req.query ?? {}).length ? { query: req.query } : {}),
    });

    if (!parsed.success) {
      return next(new AppError(400, 'Validation failed'));
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
