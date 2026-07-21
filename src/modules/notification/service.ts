import { prisma } from '../../config/db.js';
import type { Prisma } from '../../generated/prisma/client.js';
import { AppError } from '../../utils/response.js';

type ListNotificationsQuery = {
  type?: 'BUDGET_ALERT' | 'SUBSCRIPTION' | 'SYSTEM';
  unreadOnly: boolean;
  page: number;
  limit: number;
};

export const listNotifications = async (
  userId: string,
  query: ListNotificationsQuery,
) => {
  const where: Prisma.NotificationWhereInput = {
    userId,
    ...(query.type ? { type: query.type } : {}),
    ...(query.unreadOnly ? { readAt: null } : {}),
  };
  const skip = (query.page - 1) * query.limit;
  const [items, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: query.limit,
    }),
    prisma.notification.count({ where }),
  ]);

  return {
    items,
    meta: {
      total,
      page: query.page,
      limit: query.limit,
      pages: Math.ceil(total / query.limit),
    },
  };
};

export const getUnreadCount = async (userId: string) => ({
  count: await prisma.notification.count({
    where: { userId, readAt: null },
  }),
});

export const markAsRead = async (userId: string, id: string) => {
  const result = await prisma.notification.updateMany({
    where: { id, userId },
    data: { readAt: new Date() },
  });
  if (result.count === 0) throw new AppError(404, 'Notification not found');

  return prisma.notification.findFirst({ where: { id, userId } });
};

export const markAllAsRead = async (userId: string) => {
  const result = await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
  return { updatedCount: result.count };
};
