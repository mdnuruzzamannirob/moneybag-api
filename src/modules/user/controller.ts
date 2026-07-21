import type { RequestHandler } from 'express';
import { recordAudit } from '../../services/audit.service.js';
import { clearAuthCookies } from '../../utils/cookies.js';
import { sendResponse } from '../../utils/response.js';
import * as service from './service.js';

export const me: RequestHandler = async (req, res, next) => {
  try {
    sendResponse(res, 200, 'Profile fetched', await service.getProfile(req.user!.id));
  } catch (error) {
    next(error);
  }
};

export const updateMe: RequestHandler = async (req, res, next) => {
  try {
    const user = await service.updateProfile(req.user!.id, req.body);
    await recordAudit({ userId: req.user!.id, action: 'PROFILE_UPDATED' });
    sendResponse(res, 200, 'Profile updated', user);
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
    clearAuthCookies(res);
    await recordAudit({ userId: req.user!.id, action: 'PASSWORD_CHANGED' });
    sendResponse(res, 200, 'Password changed; please sign in again');
  } catch (error) {
    next(error);
  }
};

export const exportData: RequestHandler = async (req, res, next) => {
  try {
    const query = res.locals.validated?.query as { format: 'json' | 'csv' };
    const result = await service.exportData(req.user!.id, query.format);
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.body);
  } catch (error) {
    next(error);
  }
};

export const deleteAccount: RequestHandler = async (req, res, next) => {
  try {
    await recordAudit({
      userId: req.user!.id,
      action: 'ACCOUNT_DELETION_REQUESTED',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });
    await service.deleteAccount(req.user!.id, req.body.password);
    clearAuthCookies(res);
    sendResponse(res, 200, 'Account and personal data deleted');
  } catch (error) {
    next(error);
  }
};
