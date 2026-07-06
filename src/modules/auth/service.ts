import { env } from '@/config/env.js';
import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import { prisma } from '../../config/db.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  type JwtPayload,
} from '../../utils/jwt.js';
import { sendMail } from '../../utils/mailer.js';
import { AppError } from '../../utils/response.js';

const defaultCategories = [
  { name: 'Salary', type: 'INCOME' as const, icon: 'wallet', color: '#1f9d55' },
  {
    name: 'Freelance',
    type: 'INCOME' as const,
    icon: 'briefcase',
    color: '#2563eb',
  },
  {
    name: 'Food',
    type: 'EXPENSE' as const,
    icon: 'utensils',
    color: '#f97316',
  },
  {
    name: 'Transport',
    type: 'EXPENSE' as const,
    icon: 'car',
    color: '#7c3aed',
  },
  {
    name: 'Bills',
    type: 'EXPENSE' as const,
    icon: 'receipt',
    color: '#dc2626',
  },
];

const tokenPayload = (user: {
  id: string;
  email: string;
  role: string;
}): JwtPayload => ({
  sub: user.id,
  email: user.email,
  role: user.role,
});

const issueTokens = async (user: {
  id: string;
  email: string;
  role: string;
}) => {
  const payload = tokenPayload(user);
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken({
    ...payload,
    jti: crypto.randomUUID(),
  });
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: { token: refreshToken, userId: user.id, expiresAt },
  });

  return { accessToken, refreshToken };
};

export const register = async (input: {
  name: string;
  email: string;
  password: string;
  currency: string;
}) => {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (existing) throw new AppError(409, 'Email is already registered');

  const password = await bcrypt.hash(input.password, 12);
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      password,
      currency: input.currency,
      categories: { create: defaultCategories },
    },
    select: { id: true, name: true, email: true, role: true, currency: true },
  });

  const tokens = await issueTokens(user)

  const text = `Hi ${user.name},\n\nWelcome to Expense Tracker! We're excited to have you on board.\n\nBest,\nThe Expense Tracker Team`
  const html = `<p>Hi ${user.name},</p><p>Welcome to Expense Tracker! We're excited to have you on board.</p><p>Best,<br>The Expense Tracker Team</p>`
  await sendMail(user.email, 'Welcome to Expense Tracker!', text, html)

  return { user, ...tokens }
}

export const login = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) throw new AppError(401, 'Invalid credentials');

  const matched = await bcrypt.compare(password, user.password);
  if (!matched) throw new AppError(401, 'Invalid credentials');

  const tokens = await issueTokens(user);
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      currency: user.currency,
    },
    ...tokens,
  };
};

export const refresh = async (refreshToken: string) => {
  const stored = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
  });
  if (!stored || stored.revoked || stored.expiresAt < new Date()) {
    throw new AppError(401, 'Invalid refresh token');
  }

  const payload = verifyRefreshToken(refreshToken);
  await prisma.refreshToken.update({
    where: { token: refreshToken },
    data: { revoked: true },
  });
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: payload.sub },
  });
  return issueTokens(user);
};

export const logout = async (refreshToken: string) => {
  await prisma.refreshToken.updateMany({
    where: { token: refreshToken },
    data: { revoked: true },
  });
};

export const forgotPassword = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return;

  const resetToken = crypto.randomBytes(32).toString('hex');
  await prisma.passwordResetToken.create({
    data: {
      token: resetToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  })
  const resetUrl = `${env.CORS_ORIGIN}/reset-password?token=${resetToken}`
  const text = `You are receiving this email because you (or someone else) have requested the reset of the password for your account.\nPlease click on the following link, or paste this into your browser to complete the process: ${resetUrl}\nThis link is valid for only 1 hour.\nIf you did not request this, please ignore this email and your password will remain unchanged.`
  const html = `<p>You are receiving this email because you (or someone else) have requested the reset of the password for your account.</p>\n<p>Please click on the following link to complete the process:</p>\n<p><a href="${resetUrl}">${resetUrl}</a></p>\n<p>This link is valid for only 1 hour.</p>\n<p>If you did not request this, please ignore this email and your password will remain unchanged.</p>`

  await sendMail(user.email, 'Expense Tracker - Password Reset', text, html);
};

export const resetPassword = async (token: string, password: string) => {
  const stored = await prisma.passwordResetToken.findUnique({
    where: { token },
  });
  if (!stored || stored.used || stored.expiresAt < new Date()) {
    throw new AppError(400, 'Invalid or expired reset token');
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: stored.userId },
      data: { password: hashedPassword },
    }),
    prisma.passwordResetToken.update({
      where: { token },
      data: { used: true },
    }),
  ]);
};
