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

  if (data !== undefined) body.data = data;
  if (meta !== undefined) body.meta = meta;
  if (errors !== undefined) body.errors = errors;

  return res.status(statusCode).json(body);
};

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}
