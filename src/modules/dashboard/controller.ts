import type { RequestHandler } from 'express';
import { sendResponse } from '../../utils/response.js';
import { getDashboard } from './service.js';

export const dashboard: RequestHandler = async (req, res, next) => {
  try {
    sendResponse(
      res,
      200,
      'Dashboard fetched',
      await getDashboard(req.user!.id),
    );
  } catch (error) {
    next(error);
  }
};
