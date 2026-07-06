import type { RequestHandler } from 'express';
import * as service from './service.js';
import { sendResponse } from '../../utils/response.js';
import { AppError } from '../../utils/response.js';

export const list: RequestHandler = async (req, res, next) => {
  try {
    const result = await service.list(req.user!.id, req.query as never);
    sendResponse(res, 200, 'Transactions fetched', result.items, result.meta);
  } catch (error) {
    next(error);
  }
};

export const create: RequestHandler = async (req, res, next) => {
  try {
    sendResponse(
      res,
      201,
      'Transaction created',
      await service.create(req.user!.id, req.body),
    );
  } catch (error) {
    next(error);
  }
};

export const update: RequestHandler = async (req, res, next) => {
  try {
    sendResponse(
      res,
      200,
      'Transaction updated',
      await service.update(req.user!.id, String(req.params.id), req.body),
    );
  } catch (error) {
    next(error);
  }
};

export const remove: RequestHandler = async (req, res, next) => {
  try {
    await service.remove(req.user!.id, String(req.params.id));
    sendResponse(res, 200, 'Transaction deleted');
  } catch (error) {
    next(error);
  }
};

export const importCsv: RequestHandler = async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) throw new AppError(400, 'CSV file is required');
    sendResponse(
      res,
      201,
      'Transactions imported',
      await service.importCsv(req.user!.id, file.buffer.toString('utf8')),
    );
  } catch (error) {
    next(error);
  }
};
