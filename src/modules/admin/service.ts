import { prisma } from '../../config/db.js';

export const users = async (query: {
  search?: string;
  role?: 'USER' | 'ADMIN';
  isActive?: boolean;
  page: number;
  limit: number;
}) => {
  const where = {
    ...(query.role ? { role: query.role } : {}),
    ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
    ...(query.search
      ? {
          OR: [
            {
              name: {
                contains: query.search,
                mode: 'insensitive' as const,
              },
            },
            {
              email: {
                contains: query.search,
                mode: 'insensitive' as const,
              },
            },
          ],
        }
      : {}),
  };
  const skip = (query.page - 1) * query.limit;
  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        currency: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: query.limit,
    }),
    prisma.user.count({ where }),
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

export const updateStatus = async (id: string, isActive: boolean) =>
  prisma.user.update({
    where: { id },
    data: { isActive },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });

export const stats = async () => {
  const [totalUsers, activeUsers, volume, transactions] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.transaction.aggregate({ _sum: { amount: true } }),
    prisma.transaction.count(),
  ]);

  return {
    totalUsers,
    usersCount: totalUsers,
    activeUsers,
    inactiveUsers: totalUsers - activeUsers,
    totalTransactions: transactions,
    transactionsCount: transactions,
    totalTransactionVolume: volume._sum.amount ?? 0,
    totalVolume: volume._sum.amount ?? 0,
  };
};
