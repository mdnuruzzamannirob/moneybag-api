import type { RequestHandler } from 'express';
import { recordAudit } from '../../services/audit.service.js';
import {
  clearAuthCookies,
  REFRESH_COOKIE,
  setAuthCookies,
} from '../../utils/cookies.js';
import { AppError, sendResponse } from '../../utils/response.js';
import * as authService from './service.js';

const auditContext = (req: Parameters<RequestHandler>[0]) => ({
  ipAddress: req.ip,
  userAgent: req.get('user-agent'),
});

const completeLogin = async (
  req: Parameters<RequestHandler>[0],
  res: Parameters<RequestHandler>[1],
  result: Awaited<ReturnType<typeof authService.login>>,
  message: string,
  status: number,
) => {
  setAuthCookies(res, result.tokens);
  await recordAudit({
    userId: result.user.id,
    action: status === 201 ? 'USER_REGISTERED' : 'USER_LOGIN',
    ...auditContext(req),
  });
  return sendResponse(res, status, message, { user: result.user });
};

export const register: RequestHandler = async (req, res, next) => {
  try {
    await completeLogin(
      req,
      res,
      await authService.register(req.body),
      'Registered successfully',
      201,
    );
  } catch (error) {
    next(error);
  }
};

export const login: RequestHandler = async (req, res, next) => {
  try {
    await completeLogin(
      req,
      res,
      await authService.login(req.body.email, req.body.password),
      'Logged in successfully',
      200,
    );
  } catch (error) {
    next(error);
  }
};

export const google: RequestHandler = async (req, res, next) => {
  try {
    await completeLogin(
      req,
      res,
      await authService.googleLogin(req.body.credential),
      'Google authentication successful',
      200,
    );
  } catch (error) {
    next(error);
  }
};

export const refresh: RequestHandler = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.[REFRESH_COOKIE] || req.body?.refreshToken;
    if (!refreshToken) throw new AppError(401, 'Refresh token is required');
    const tokens = await authService.refresh(refreshToken);
    setAuthCookies(res, tokens);
    sendResponse(res, 200, 'Token refreshed');
  } catch (error) {
    clearAuthCookies(res);
    next(error);
  }
};

export const logout: RequestHandler = async (req, res, next) => {
  try {
    await authService.logout(
      req.cookies?.[REFRESH_COOKIE] || req.body?.refreshToken,
    );
    clearAuthCookies(res);
    sendResponse(res, 200, 'Logged out successfully');
  } catch (error) {
    clearAuthCookies(res);
    next(error);
  }
};

export const me: RequestHandler = async (req, res, next) => {
  try {
    sendResponse(
      res,
      200,
      'Current user',
      await authService.getCurrentUser(req.user!.id),
    );
  } catch (error) {
    next(error);
  }
};

export const forgotPassword: RequestHandler = async (req, res, next) => {
  try {
    await authService.forgotPassword(req.body.email);
    sendResponse(res, 200, 'If the email exists, a reset message has been sent');
  } catch (error) {
    next(error);
  }
};

export const resetPassword: RequestHandler = async (req, res, next) => {
  try {
    await authService.resetPassword(req.body.token, req.body.password);
    clearAuthCookies(res);
    sendResponse(res, 200, 'Password reset successfully');
  } catch (error) {
    next(error);
  }
};
