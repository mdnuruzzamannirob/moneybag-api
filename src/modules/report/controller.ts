import type { RequestHandler } from 'express';
import * as service from './service.js';
import { sendResponse } from '../../utils/response.js';

export const monthly: RequestHandler = async (req, res, next) => {
  try {
    sendResponse(
      res,
      200,
      'Monthly report fetched',
      await service.monthly(
        req.user!.id,
        Number(req.query.month),
        Number(req.query.year),
      ),
    );
  } catch (error) {
    next(error);
  }
};

export const yearly: RequestHandler = async (req, res, next) => {
  try {
    sendResponse(
      res,
      200,
      'Yearly report fetched',
      await service.yearly(req.user!.id, Number(req.query.year)),
    );
  } catch (error) {
    next(error);
  }
};

export const categoryBreakdown: RequestHandler = async (req, res, next) => {
  try {
    sendResponse(
      res,
      200,
      'Category breakdown fetched',
      await service.categoryBreakdown(
        req.user!.id,
        Number(req.query.month),
        Number(req.query.year),
      ),
    );
  } catch (error) {
    next(error);
  }
};

export const trend: RequestHandler = async (req, res, next) => {
  try {
    sendResponse(
      res,
      200,
      'Trend fetched',
      await service.trend(
        req.user!.id,
        String(req.query.from),
        String(req.query.to),
      ),
    );
  } catch (error) {
    next(error);
  }
};

export const exportReport: RequestHandler = async (req, res, next) => {
  try {
    const result = await service.exportReport(
      req.user!.id,
      req.query.type as 'pdf' | 'csv',
      Number(req.query.month),
      Number(req.query.year),
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
