import type { RequestHandler } from 'express';
import * as service from './service.js';
import { sendResponse } from '../../utils/response.js';

export const monthly: RequestHandler = async (req, res, next) => {
  try {
    const query = res.locals.validated.query as { month: number; year: number };
    sendResponse(
      res,
      200,
      'Monthly report fetched',
      await service.monthly(
        req.user!.id,
        query.month,
        query.year,
      ),
    );
  } catch (error) {
    next(error);
  }
};

export const yearly: RequestHandler = async (req, res, next) => {
  try {
    const query = res.locals.validated.query as { year: number };
    sendResponse(
      res,
      200,
      'Yearly report fetched',
      await service.yearly(req.user!.id, query.year),
    );
  } catch (error) {
    next(error);
  }
};

export const categoryBreakdown: RequestHandler = async (req, res, next) => {
  try {
    const query = res.locals.validated.query as { month: number; year: number };
    sendResponse(
      res,
      200,
      'Category breakdown fetched',
      await service.categoryBreakdown(
        req.user!.id,
        query.month,
        query.year,
      ),
    );
  } catch (error) {
    next(error);
  }
};

export const trend: RequestHandler = async (req, res, next) => {
  try {
    const query = res.locals.validated.query as { from: Date; to: Date };
    sendResponse(
      res,
      200,
      'Trend fetched',
      await service.trend(
        req.user!.id,
        query.from,
        query.to,
      ),
    );
  } catch (error) {
    next(error);
  }
};

export const exportReport: RequestHandler = async (req, res, next) => {
  try {
    const query = res.locals.validated.query as {
      type: 'pdf' | 'csv';
      month: number;
      year: number;
    };
    const result = await service.exportReport(
      req.user!.id,
      query.type,
      query.month,
      query.year,
    );
    res.setHeader('Content-Type', result.contentType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${result.filename}"`,
    );
    res.send(result.body);
  } catch (error) {
    next(error);
  }
};
