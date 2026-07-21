import type { RequestHandler } from 'express';
import { sendResponse } from '../../utils/response.js';
import * as service from './service.js';

export const list: RequestHandler = async (req, res, next) => {
  try {
    const query = res.locals.validated?.query;
    const { items, meta } = await service.listNotifications(
      req.user!.id,
      query as Parameters<typeof service.listNotifications>[1],
    );
    sendResponse(res, 200, 'Notifications fetched', items, meta);
  } catch (error) {
    next(error);
  }
};

export const unreadCount: RequestHandler = async (req, res, next) => {
  try {
    sendResponse(
      res,
      200,
      'Unread notification count fetched',
      await service.getUnreadCount(req.user!.id),
    );
  } catch (error) {
    next(error);
  }
};

export const markRead: RequestHandler = async (req, res, next) => {
  try {
    sendResponse(
      res,
      200,
      'Notification marked as read',
      await service.markAsRead(req.user!.id, String(req.params.id)),
    );
  } catch (error) {
    next(error);
  }
};

export const markAllRead: RequestHandler = async (req, res, next) => {
  try {
    sendResponse(
      res,
      200,
      'Notifications marked as read',
      await service.markAllAsRead(req.user!.id),
    );
  } catch (error) {
    next(error);
  }
};
