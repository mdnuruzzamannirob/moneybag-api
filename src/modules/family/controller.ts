import type { RequestHandler } from 'express';
import { sendResponse } from '../../utils/response.js';
import * as service from './service.js';

export const listGroups: RequestHandler = async (req, res, next) => {
  try {
    const query = res.locals.validated?.query;
    const { items, meta } = await service.listGroups(
      req.user!.id,
      query as Parameters<typeof service.listGroups>[1],
    );
    sendResponse(res, 200, 'Family groups fetched', items, meta);
  } catch (error) {
    next(error);
  }
};

export const createGroup: RequestHandler = async (req, res, next) => {
  try {
    sendResponse(
      res,
      201,
      'Family group created',
      await service.createGroup(req.user!.id, req.body.name),
    );
  } catch (error) {
    next(error);
  }
};

export const inviteMember: RequestHandler = async (req, res, next) => {
  try {
    sendResponse(
      res,
      201,
      'Family invitation created',
      await service.inviteMember(
        req.user!.id,
        String(req.params.id),
        req.body,
      ),
    );
  } catch (error) {
    next(error);
  }
};

export const acceptInvitation: RequestHandler = async (req, res, next) => {
  try {
    sendResponse(
      res,
      200,
      'Family invitation accepted',
      await service.acceptInvitation(
        { id: req.user!.id, email: req.user!.email },
        String(req.params.token),
      ),
    );
  } catch (error) {
    next(error);
  }
};

export const removeMember: RequestHandler = async (req, res, next) => {
  try {
    await service.removeMember(
      req.user!.id,
      String(req.params.id),
      String(req.params.userId),
    );
    sendResponse(res, 200, 'Family member removed');
  } catch (error) {
    next(error);
  }
};

export const listGroupTransactions: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const query = res.locals.validated?.query;
    const { group, items, meta } = await service.listGroupTransactions(
      req.user!.id,
      String(req.params.id),
      query as Parameters<typeof service.listGroupTransactions>[2],
    );
    sendResponse(
      res,
      200,
      'Family transactions fetched',
      { group, transactions: items },
      meta,
    );
  } catch (error) {
    next(error);
  }
};
