import type { RequestHandler } from 'express';
import { AppError, sendResponse } from '../../utils/response.js';
import * as service from './service.js';

export const plans: RequestHandler = async (_req, res, next) => {
  try {
    sendResponse(res, 200, 'Plans fetched', await service.listPlans());
  } catch (error) {
    next(error);
  }
};

export const subscription: RequestHandler = async (req, res, next) => {
  try {
    sendResponse(
      res,
      200,
      'Subscription fetched',
      await service.getSubscription(req.user!.id),
    );
  } catch (error) {
    next(error);
  }
};

export const checkout: RequestHandler = async (req, res, next) => {
  try {
    sendResponse(
      res,
      201,
      'Checkout session created',
      await service.createCheckout(req.user!.id, req.body),
    );
  } catch (error) {
    next(error);
  }
};

export const portal: RequestHandler = async (req, res, next) => {
  try {
    sendResponse(
      res,
      201,
      'Billing portal session created',
      await service.createPortal(req.user!.id),
    );
  } catch (error) {
    next(error);
  }
};

export const webhook: RequestHandler = async (req, res, next) => {
  try {
    if (!Buffer.isBuffer(req.body)) {
      throw new AppError(
        400,
        'Stripe webhook requires an unparsed application/json body',
      );
    }
    const header = req.headers['stripe-signature'];
    const signature = Array.isArray(header) ? header[0] : header;
    if (!signature) throw new AppError(400, 'Stripe signature is required');

    const event = service.constructWebhookEvent(req.body, signature);
    const processed = await service.processWebhookEvent(event);
    sendResponse(
      res,
      200,
      processed ? 'Webhook processed' : 'Webhook already processed',
    );
  } catch (error) {
    next(error);
  }
};
