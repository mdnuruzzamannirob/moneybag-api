import type { RequestHandler } from 'express';
import { sendResponse } from '../../utils/response.js';
import * as service from './service.js';

export const users: RequestHandler = async (req, res, next) => {
  try {
    const query = res.locals.validated?.query ?? req.query;
    sendResponse(
      res,
      200,
      'Users fetched',
      await service.users(query as Parameters<typeof service.users>[0]),
    );
  } catch (error) {
    next(error);
  }
};

export const updateStatus: RequestHandler = async (req, res, next) => {
  try {
    sendResponse(
      res,
      200,
      'User status updated',
      await service.updateStatus(String(req.params.id), req.body.isActive),
    );
  } catch (error) {
    next(error);
  }
};

export const stats: RequestHandler = async (_req, res, next) => {
  try {
    sendResponse(res, 200, 'Platform stats fetched', await service.stats());
  } catch (error) {
    next(error);
  }
};
