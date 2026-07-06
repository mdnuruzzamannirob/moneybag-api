import type { RequestHandler } from 'express';
import * as service from './service.js';
import { sendResponse } from '../../utils/response.js';

export const me: RequestHandler = async (req, res, next) => {
  try {
    sendResponse(
      res,
      200,
      'Profile fetched',
      await service.getProfile(req.user!.id),
    );
  } catch (error) {
    next(error);
  }
};

export const updateMe: RequestHandler = async (req, res, next) => {
  try {
    sendResponse(
      res,
      200,
      'Profile updated',
      await service.updateProfile(req.user!.id, req.body),
    );
  } catch (error) {
    next(error);
  }
};

export const changePassword: RequestHandler = async (req, res, next) => {
  try {
    await service.changePassword(
      req.user!.id,
      req.body.currentPassword,
      req.body.newPassword,
    );
    sendResponse(res, 200, 'Password changed');
  } catch (error) {
    next(error);
  }
};
