import type { RequestHandler } from 'express';
import { AppError, sendResponse } from '../../utils/response.js';
import * as service from './service.js';

export const list: RequestHandler = async (req, res, next) => {
  try {
    const result = await service.list(
      req.user!.id,
      res.locals.validated.query as service.ListQuery,
    );
    sendResponse(res, 200, 'Transactions fetched', result.items, result.meta);
  } catch (error) {
    next(error);
  }
};

export const create: RequestHandler = async (req, res, next) => {
  try {
    sendResponse(res, 201, 'Transaction created', await service.create(req.user!.id, req.body));
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
    if (!req.file) throw new AppError(400, 'CSV file is required');
    sendResponse(
      res,
      201,
      'Transactions imported',
      await service.importCsv(req.user!.id, req.file.buffer.toString('utf8')),
    );
  } catch (error) {
    next(error);
  }
};

export const attachReceipt: RequestHandler = async (req, res, next) => {
  try {
    if (!req.file) throw new AppError(400, 'Receipt image is required');
    sendResponse(
      res,
      200,
      'Receipt uploaded',
      await service.attachReceipt(req.user!.id, String(req.params.id), req.file),
    );
  } catch (error) {
    next(error);
  }
};
