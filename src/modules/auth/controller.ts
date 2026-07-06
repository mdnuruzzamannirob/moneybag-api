import type { RequestHandler } from 'express';
import * as authService from './service.js';
import { sendResponse } from '../../utils/response.js';

export const register: RequestHandler = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    sendResponse(res, 201, 'Registered successfully', result);
  } catch (error) {
    next(error);
  }
};

export const login: RequestHandler = async (req, res, next) => {
  try {
    const result = await authService.login(req.body.email, req.body.password);
    sendResponse(res, 200, 'Logged in successfully', result);
  } catch (error) {
    next(error);
  }
};

export const refresh: RequestHandler = async (req, res, next) => {
  try {
    sendResponse(
      res,
      200,
      'Token refreshed',
      await authService.refresh(req.body.refreshToken),
    );
  } catch (error) {
    next(error);
  }
};

export const logout: RequestHandler = async (req, res, next) => {
  try {
    await authService.logout(req.body.refreshToken);
    sendResponse(res, 200, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

export const forgotPassword: RequestHandler = async (req, res, next) => {
  try {
    await authService.forgotPassword(req.body.email);
    sendResponse(
      res,
      200,
      'If the email exists, a reset message has been sent',
    );
  } catch (error) {
    next(error);
  }
};

export const resetPassword: RequestHandler = async (req, res, next) => {
  try {
    await authService.resetPassword(req.body.token, req.body.password);
    sendResponse(res, 200, 'Password reset successfully');
  } catch (error) {
    next(error);
  }
};
