import bcrypt from 'bcrypt';
import { deleteReceipt } from '../../config/cloudinary.js';
import { prisma } from '../../config/db.js';
import { env } from '../../config/env.js';
import { stripe } from '../../config/stripe.js';
import type { Prisma } from '../../generated/prisma/client.js';
import { generateCsv } from '../../utils/csvGenerator.js';
import { AppError } from '../../utils/response.js';

const profileSelect = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
  currency: true,
  theme: true,
  notificationPreferences: true,
  role: true,
  isActive: true,
  trialEndsAt: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
  subscription: { include: { plan: true } },
} satisfies Prisma.UserSelect;

export const getProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: profileSelect,
  });
  if (!user) throw new AppError(404, 'User not found');
  return user;
};

export const updateProfile = async (
  userId: string,
  data: {
    name?: string;
    currency?: string;
    theme?: 'light' | 'dark' | 'system';
    avatarUrl?: string | null;
    notificationPreferences?: Record<string, boolean>;
  },
) => {
  let preferences: Prisma.InputJsonValue | undefined;
  if (data.notificationPreferences) {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const current =
      user.notificationPreferences &&
      typeof user.notificationPreferences === 'object' &&
      !Array.isArray(user.notificationPreferences)
        ? user.notificationPreferences
        : {};
    preferences = {
      ...(current as Record<string, Prisma.JsonValue>),
      ...data.notificationPreferences,
    } as Prisma.InputJsonValue;
  }

  return prisma.user.update({
    where: { id: userId },
    data: {
      name: data.name,
      currency: data.currency,
      theme: data.theme,
      avatarUrl: data.avatarUrl,
      notificationPreferences: preferences,
    },
    select: profileSelect,
  });
};

export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string,
) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.passwordHash) {
    throw new AppError(400, 'This account does not have a password');
  }
  if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
    throw new AppError(401, 'Current password is incorrect');
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await bcrypt.hash(newPassword, 12) },
    }),
    prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    }),
  ]);
};

const collectData = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      ...profileSelect,
      categories: true,
      transactions: { include: { category: true }, orderBy: { date: 'asc' } },
      budgets: { include: { category: true } },
      savingsGoals: { include: { contributions: true } },
      ownedFamilyGroups: { include: { members: { include: { user: { select: { id: true, name: true, email: true } } } } } },
      familyMemberships: { include: { group: true } },
      notifications: true,
    },
  });
  if (!user) throw new AppError(404, 'User not found');
  return user;
};

export const exportData = async (userId: string, format: 'json' | 'csv') => {
  const data = await collectData(userId);
  if (format === 'json') {
    return {
      contentType: 'application/json',
      filename: `moneybag-data-${new Date().toISOString().slice(0, 10)}.json`,
      body: JSON.stringify(data, null, 2),
    };
  }

  const rows = data.transactions.map((transaction) => ({
    id: transaction.id,
    date: transaction.date.toISOString().slice(0, 10),
    type: transaction.type,
    amount: transaction.amount.toString(),
    category: transaction.category.name,
    note: transaction.note ?? '',
    tags: transaction.tags.join('|'),
    receiptUrl: transaction.receiptUrl ?? '',
  }));
  return {
    contentType: 'text/csv',
    filename: `moneybag-transactions-${new Date().toISOString().slice(0, 10)}.csv`,
    body: generateCsv(rows),
  };
};

export const deleteAccount = async (userId: string, password?: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      subscription: true,
      transactions: {
        where: { receiptPublicId: { not: null } },
        select: { receiptPublicId: true },
      },
    },
  });
  if (!user) throw new AppError(404, 'User not found');
  if (user.passwordHash) {
    if (!password || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new AppError(401, 'Password is incorrect');
    }
  }

  if (
    env.STRIPE_SECRET_KEY &&
    user.subscription?.stripeSubscriptionId &&
    user.subscription.status !== 'CANCELED'
  ) {
    await stripe.subscriptions.cancel(user.subscription.stripeSubscriptionId);
  }

  for (const receipt of user.transactions) {
    if (receipt.receiptPublicId) await deleteReceipt(receipt.receiptPublicId);
  }
  await prisma.user.delete({ where: { id: userId } });
};
