import type { RequestHandler } from 'express';
import * as authService from './service.js';
import { clearAuthCookies, setAuthCookies } from '../../utils/cookies.js';
import { AppError, sendResponse } from '../../utils/response.js';

export const register: RequestHandler = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    setAuthCookies(res, {
      accessToken: result.tokens.accessToken,
      refreshToken: result.tokens.refreshToken,
    });
    // The response body contains only the user. Tokens are HttpOnly cookies.
    sendResponse(res, 201, 'Registered successfully', { user: result.user });
  } catch (error) {
    next(error);
  }
};

export const login: RequestHandler = async (req, res, next) => {
  try {
    const result = await authService.login(req.body.email, req.body.password);
    setAuthCookies(res, {
      accessToken: result.tokens.accessToken,
      refreshToken: result.tokens.refreshToken,
    });
    sendResponse(res, 200, 'Logged in successfully', { user: result.user });
  } catch (error) {
    next(error);
  }
};

export const refresh: RequestHandler = async (req, res, next) => {
  try {
    const refreshToken =
      req.cookies?.refreshToken || req.body?.refreshToken;
    if (!refreshToken) {
      clearAuthCookies(res);
      return sendResponse(res, 401, 'Refresh token is required');
    }
    const tokens = await authService.refresh(refreshToken);
    setAuthCookies(res, tokens);
    sendResponse(res, 200, 'Token refreshed');
  } catch (error) {
    clearAuthCookies(res);
    if (error instanceof AppError) {
      return sendResponse(res, error.statusCode, error.message);
    }
    next(error);
  }
};

export const logout: RequestHandler = async (req, res, next) => {
  try {
    const refreshToken =
      req.cookies?.refreshToken || req.body?.refreshToken;
    if (refreshToken) {
      await authService.logout(refreshToken);
    }
    clearAuthCookies(res);
    sendResponse(res, 200, 'Logged out successfully');
  } catch (error) {
    clearAuthCookies(res);
    next(error);
  }
};

export const me: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      return sendResponse(res, 401, 'Authentication required');
    }
    const user = await authService.getCurrentUser(req.user.id);
    sendResponse(res, 200, 'Current user', { user });
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
    clearAuthCookies(res);
    sendResponse(res, 200, 'Password reset successfully');
  } catch (error) {
    next(error);
  }
};
