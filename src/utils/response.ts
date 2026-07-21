import type { Response } from 'express';

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
  errors?: unknown;
  meta?: Record<string, unknown>;
};

export const sendResponse = <T>(
  res: Response,
  statusCode: number,
  message: string,
  data?: T,
  meta?: Record<string, unknown>,
  errors?: unknown,
) => {
  const body: ApiResponse<T> = { success: statusCode < 400, message };

  if (data !== undefined) body.data = toJsonSafe(data) as T;
  if (meta !== undefined) body.meta = meta;
  if (errors !== undefined) body.errors = errors;

  return res.status(statusCode).json(body);
};

const toJsonSafe = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(toJsonSafe);
  if (value instanceof Date) return value;
  if (Buffer.isBuffer(value)) return value;
  if (value && typeof value === 'object') {
    const decimal = value as { constructor?: { name?: string }; toNumber?: () => number };
    if (
      decimal.constructor?.name === 'Decimal' &&
      typeof decimal.toNumber === 'function'
    ) {
      return decimal.toNumber();
    }

    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, toJsonSafe(item)]),
    );
  }
  return value;
};

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  code?: string;
  details?: unknown;

  constructor(
    statusCode: number,
    message: string,
    code?: string,
    details?: unknown,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;
    this.details = details;
  }
}
