import type { Request, RequestHandler, Response } from 'express';
import { AppError, sendResponse } from '../../utils/response.js';
import * as service from './service.js';

const query = <T>(req: Request, res: Response) =>
  (res.locals.validated?.query ?? req.query) as T;

const body = <T>(req: Request, res: Response) =>
  (res.locals.validated?.body ?? req.body) as T;

const context = (req: Request): service.AuditContext => {
  if (!req.user) throw new AppError(401, 'Authentication is required');
  return {
    actorId: req.user.id,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  };
};

export const stats: RequestHandler = async (_req, res, next) => {
  try {
    sendResponse(res, 200, 'Platform stats fetched', await service.stats());
  } catch (error) {
    next(error);
  }
};

export const users: RequestHandler = async (req, res, next) => {
  try {
    const { items, meta } = await service.users(
      query<service.ListUsersQuery>(req, res),
    );
    sendResponse(res, 200, 'Users fetched', items, meta);
  } catch (error) {
    next(error);
  }
};

export const userDetail: RequestHandler = async (req, res, next) => {
  try {
    sendResponse(
      res,
      200,
      'User fetched',
      await service.userDetail(String(req.params.id)),
    );
  } catch (error) {
    next(error);
  }
};

export const updateStatus: RequestHandler = async (req, res, next) => {
  try {
    const input = body<{ isActive: boolean }>(req, res);
    sendResponse(
      res,
      200,
      'User status updated',
      await service.updateStatus(
        String(req.params.id),
        input.isActive,
        context(req),
      ),
    );
  } catch (error) {
    next(error);
  }
};

export const impersonate: RequestHandler = async (req, res, next) => {
  try {
    sendResponse(
      res,
      200,
      'Impersonation token issued',
      await service.impersonate(String(req.params.id), context(req)),
    );
  } catch (error) {
    next(error);
  }
};

export const assignPlan: RequestHandler = async (req, res, next) => {
  try {
    const input = body<{ planId: string }>(req, res);
    sendResponse(
      res,
      200,
      'User plan assigned',
      await service.assignPlan(
        String(req.params.id),
        input.planId,
        context(req),
      ),
    );
  } catch (error) {
    next(error);
  }
};

export const subscriptions: RequestHandler = async (req, res, next) => {
  try {
    const { items, meta } = await service.subscriptions(
      query<service.ListSubscriptionsQuery>(req, res),
    );
    sendResponse(res, 200, 'Subscriptions fetched', items, meta);
  } catch (error) {
    next(error);
  }
};

export const refundSubscription: RequestHandler = async (req, res, next) => {
  try {
    const input = body<{
      amount?: number;
      reason: 'duplicate' | 'fraudulent' | 'requested_by_customer';
    }>(req, res);
    sendResponse(
      res,
      200,
      'Subscription payment refunded',
      await service.refundSubscription(
        String(req.params.id),
        input,
        context(req),
      ),
    );
  } catch (error) {
    next(error);
  }
};

export const cancelSubscription: RequestHandler = async (req, res, next) => {
  try {
    const input = body<{ atPeriodEnd: boolean }>(req, res);
    sendResponse(
      res,
      200,
      'Subscription canceled',
      await service.cancelSubscription(
        String(req.params.id),
        input.atPeriodEnd,
        context(req),
      ),
    );
  } catch (error) {
    next(error);
  }
};

export const reactivateSubscription: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    sendResponse(
      res,
      200,
      'Subscription reactivated',
      await service.reactivateSubscription(String(req.params.id), context(req)),
    );
  } catch (error) {
    next(error);
  }
};

export const plans: RequestHandler = async (req, res, next) => {
  try {
    const { items, meta } = await service.plans(
      query<service.ListPlansQuery>(req, res),
    );
    sendResponse(res, 200, 'Plans fetched', items, meta);
  } catch (error) {
    next(error);
  }
};

export const createPlan: RequestHandler = async (req, res, next) => {
  try {
    sendResponse(
      res,
      201,
      'Plan created',
      await service.createPlan(body<service.PlanInput>(req, res), context(req)),
    );
  } catch (error) {
    next(error);
  }
};

export const updatePlan: RequestHandler = async (req, res, next) => {
  try {
    sendResponse(
      res,
      200,
      'Plan updated',
      await service.updatePlan(
        String(req.params.id),
        body<Partial<service.PlanInput>>(req, res),
        context(req),
      ),
    );
  } catch (error) {
    next(error);
  }
};

export const archivePlan: RequestHandler = async (req, res, next) => {
  try {
    sendResponse(
      res,
      200,
      'Plan archived',
      await service.archivePlan(String(req.params.id), context(req)),
    );
  } catch (error) {
    next(error);
  }
};

export const globalCategories: RequestHandler = async (req, res, next) => {
  try {
    const { items, meta } = await service.globalCategories(
      query<service.ListGlobalCategoriesQuery>(req, res),
    );
    sendResponse(res, 200, 'Global categories fetched', items, meta);
  } catch (error) {
    next(error);
  }
};

export const createGlobalCategory: RequestHandler = async (req, res, next) => {
  try {
    sendResponse(
      res,
      201,
      'Global category created',
      await service.createGlobalCategory(
        body<service.GlobalCategoryInput>(req, res),
        context(req),
      ),
    );
  } catch (error) {
    next(error);
  }
};

export const updateGlobalCategory: RequestHandler = async (req, res, next) => {
  try {
    sendResponse(
      res,
      200,
      'Global category updated',
      await service.updateGlobalCategory(
        String(req.params.id),
        body<Partial<service.GlobalCategoryInput>>(req, res),
        context(req),
      ),
    );
  } catch (error) {
    next(error);
  }
};

export const deleteGlobalCategory: RequestHandler = async (req, res, next) => {
  try {
    sendResponse(
      res,
      200,
      'Global category deleted',
      await service.deleteGlobalCategory(String(req.params.id), context(req)),
    );
  } catch (error) {
    next(error);
  }
};

export const auditLogs: RequestHandler = async (req, res, next) => {
  try {
    const { items, meta } = await service.auditLogs(
      query<service.ListAuditLogsQuery>(req, res),
    );
    sendResponse(res, 200, 'Audit logs fetched', items, meta);
  } catch (error) {
    next(error);
  }
};

export const emailTemplates: RequestHandler = async (req, res, next) => {
  try {
    const { items, meta } = await service.emailTemplates(
      query<service.ListEmailTemplatesQuery>(req, res),
    );
    sendResponse(res, 200, 'Email templates fetched', items, meta);
  } catch (error) {
    next(error);
  }
};

export const updateEmailTemplate: RequestHandler = async (req, res, next) => {
  try {
    sendResponse(
      res,
      200,
      'Email template updated',
      await service.updateEmailTemplate(
        String(req.params.id),
        body<{ subject?: string; body?: string }>(req, res),
        context(req),
      ),
    );
  } catch (error) {
    next(error);
  }
};

export const settings: RequestHandler = async (_req, res, next) => {
  try {
    sendResponse(res, 200, 'Global settings fetched', await service.settings());
  } catch (error) {
    next(error);
  }
};

export const updateSettings: RequestHandler = async (req, res, next) => {
  try {
    sendResponse(
      res,
      200,
      'Global settings updated',
      await service.updateSettings(
        body<Record<string, unknown>>(req, res),
        context(req),
      ),
    );
  } catch (error) {
    next(error);
  }
};
