import type { RequestHandler } from 'express';
import { sendResponse } from '../../utils/response.js';
import * as service from './service.js';

export const list: RequestHandler = async (req, res, next) => {
  try {
    const query = res.locals.validated?.query ?? req.query;
    const { items, meta } = await service.list(
      req.user!.id,
      query as Parameters<typeof service.list>[1],
    );
    sendResponse(res, 200, 'Categories fetched', items, meta);
  } catch (error) {
    next(error);
  }
};

export const create: RequestHandler = async (req, res, next) => {
  try {
    sendResponse(
      res,
      201,
      'Category created',
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
      'Category updated',
      await service.update(req.user!.id, String(req.params.id), req.body),
    );
  } catch (error) {
    next(error);
  }
};

export const remove: RequestHandler = async (req, res, next) => {
  try {
    await service.remove(req.user!.id, String(req.params.id));
    sendResponse(res, 200, 'Category deleted');
  } catch (error) {
    next(error);
  }
};
