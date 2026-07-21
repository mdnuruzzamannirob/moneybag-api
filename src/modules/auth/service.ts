import bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import crypto from 'node:crypto';
import ms, { type StringValue } from 'ms';
import { prisma } from '../../config/db.js';
import { env } from '../../config/env.js';
import type { Prisma, Role } from '../../generated/prisma/client.js';
import { ensureApplicationDefaults } from '../../services/bootstrap.service.js';
import { getEffectiveSubscription } from '../../services/subscription.service.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  type JwtPayload,
} from '../../utils/jwt.js';
import { sendTemplateMail } from '../../utils/mailer.js';
import { AppError } from '../../utils/response.js';

type TokenUser = { id: string; email: string; role: Role };
type DatabaseClient = Prisma.TransactionClient | typeof prisma;

const tokenHash = (token: string) =>
  crypto.createHash('sha256').update(token).digest('hex');

const refreshTtlMs = () => {
  const parsed = ms(env.JWT_REFRESH_EXPIRES_IN as StringValue);
  return typeof parsed === 'number' ? parsed : 7 * 24 * 60 * 60 * 1000;
};

const tokenPayload = (user: TokenUser): JwtPayload => ({
  sub: user.id,
  email: user.email,
  role: user.role,
});

const buildTokens = (user: TokenUser) => {
  const payload = tokenPayload(user);
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken({ ...payload, jti: crypto.randomUUID() }),
  };
};

const persistToken = async (database: DatabaseClient, user: TokenUser) => {
  const tokens = buildTokens(user);
  await database.refreshToken.create({
    data: {
      token: tokenHash(tokens.refreshToken),
      userId: user.id,
      expiresAt: new Date(Date.now() + refreshTtlMs()),
    },
  });
  return tokens;
};

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
  currency: true,
  theme: true,
  notificationPreferences: true,
  role: true,
  trialEndsAt: true,
  lastLoginAt: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

const getPublicUser = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: publicUserSelect,
  });
  if (!user) throw new AppError(404, 'User not found');
  const subscription = await getEffectiveSubscription(id);
  return { ...user, subscription };
};

const createTrialUser = async (data: {
  name: string;
  email: string;
  passwordHash?: string;
  googleId?: string;
  avatarUrl?: string;
  currency?: string;
}) => {
  await ensureApplicationDefaults();
  const proPlan = await prisma.plan.findUniqueOrThrow({
    where: { slug: 'pro-monthly' },
  });
  const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  return prisma.user.create({
    data: {
      ...data,
      currency: data.currency ?? 'USD',
      trialEndsAt,
      lastLoginAt: new Date(),
      subscription: {
        create: {
          planId: proPlan.id,
          status: 'TRIALING',
          currentPeriodStart: new Date(),
          currentPeriodEnd: trialEndsAt,
        },
      },
    },
  });
};

export const register = async (input: {
  name: string;
  email: string;
  password: string;
  currency: string;
}) => {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new AppError(409, 'Email is already registered');

  const user = await createTrialUser({
    name: input.name,
    email: input.email,
    passwordHash: await bcrypt.hash(input.password, 12),
    currency: input.currency,
  });
  const tokens = await persistToken(prisma, user);

  void sendTemplateMail(
    'welcome',
    user.email,
    { name: user.name },
    {
      subject: 'Welcome to MoneyBag',
      body: '<p>Hi {{name}},</p><p>Welcome to MoneyBag.</p>',
    },
  ).catch(() => undefined);

  return { user: await getPublicUser(user.id), tokens };
};

export const login = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive || !user.passwordHash) {
    throw new AppError(401, 'Invalid credentials');
  }
  if (!(await bcrypt.compare(password, user.passwordHash))) {
    throw new AppError(401, 'Invalid credentials');
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });
  return {
    user: await getPublicUser(updated.id),
    tokens: await persistToken(prisma, updated),
  };
};

export const googleLogin = async (credential: string) => {
  if (!env.GOOGLE_CLIENT_ID) {
    throw new AppError(503, 'Google authentication is not configured');
  }
  const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);
  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email || payload.email_verified !== true) {
    throw new AppError(401, 'Invalid Google identity token');
  }

  const email = payload.email.toLowerCase();
  let user = await prisma.user.findFirst({
    where: { OR: [{ googleId: payload.sub }, { email }] },
  });
  if (user && !user.isActive) throw new AppError(401, 'Account is inactive');

  if (!user) {
    user = await createTrialUser({
      name: payload.name?.trim() || email.split('@')[0] || 'MoneyBag User',
      email,
      googleId: payload.sub,
      avatarUrl: payload.picture,
    });
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        googleId: user.googleId ?? payload.sub,
        avatarUrl: user.avatarUrl ?? payload.picture,
        lastLoginAt: new Date(),
      },
    });
  }

  return {
    user: await getPublicUser(user.id),
    tokens: await persistToken(prisma, user),
  };
};

export const refresh = async (refreshToken: string) => {
  let payload: JwtPayload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError(401, 'Invalid refresh token');
  }

  return prisma.$transaction(
    async (tx) => {
      const hash = tokenHash(refreshToken);
      const stored = await tx.refreshToken.findUnique({ where: { token: hash } });
      if (
        !stored ||
        stored.userId !== payload.sub ||
        stored.revoked ||
        stored.expiresAt.getTime() <= Date.now()
      ) {
        throw new AppError(401, 'Invalid refresh token');
      }

      const consumed = await tx.refreshToken.updateMany({
        where: { id: stored.id, revoked: false, expiresAt: { gt: new Date() } },
        data: { revoked: true },
      });
      if (consumed.count !== 1) throw new AppError(401, 'Refresh token was reused');

      const user = await tx.user.findUnique({ where: { id: payload.sub } });
      if (!user?.isActive) throw new AppError(401, 'User is inactive');
      return persistToken(tx, user);
    },
    { isolationLevel: 'Serializable' },
  );
};

export const logout = async (refreshToken?: string) => {
  if (!refreshToken) return;
  await prisma.refreshToken.updateMany({
    where: { token: tokenHash(refreshToken), revoked: false },
    data: { revoked: true },
  });
};

export const logoutAll = async (userId: string) => {
  await prisma.refreshToken.updateMany({
    where: { userId, revoked: false },
    data: { revoked: true },
  });
};

export const getCurrentUser = getPublicUser;

export const forgotPassword = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return;

  const rawToken = crypto.randomBytes(32).toString('hex');
  await prisma.$transaction([
    prisma.passwordResetToken.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    }),
    prisma.passwordResetToken.create({
      data: {
        token: tokenHash(rawToken),
        userId: user.id,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    }),
  ]);

  const resetUrl = `${env.APP_URL.replace(/\/$/, '')}/reset-password?token=${rawToken}`;
  await sendTemplateMail(
    'password-reset',
    user.email,
    { name: user.name, resetUrl },
    {
      subject: 'Reset your MoneyBag password',
      body: '<p>Hi {{name}},</p><p><a href="{{resetUrl}}">Reset your password</a>. This link expires in one hour.</p>',
    },
  ).catch(() => undefined);
};

export const resetPassword = async (rawToken: string, password: string) => {
  const hash = tokenHash(rawToken);
  await prisma.$transaction(async (tx) => {
    const stored = await tx.passwordResetToken.findUnique({
      where: { token: hash },
    });
    if (!stored || stored.used || stored.expiresAt.getTime() <= Date.now()) {
      throw new AppError(400, 'Invalid or expired reset token');
    }
    const consumed = await tx.passwordResetToken.updateMany({
      where: { id: stored.id, used: false, expiresAt: { gt: new Date() } },
      data: { used: true },
    });
    if (consumed.count !== 1) throw new AppError(400, 'Reset token was already used');
    await tx.user.update({
      where: { id: stored.userId },
      data: { passwordHash: await bcrypt.hash(password, 12) },
    });
    await tx.refreshToken.updateMany({
      where: { userId: stored.userId, revoked: false },
      data: { revoked: true },
    });
  });
};
