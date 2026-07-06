import { prisma } from '../../config/db.js';
import { AppError } from '../../utils/response.js';

const ensureExpenseCategory = async (userId: string, categoryId: string) => {
  const category = await prisma.category.findFirst({
    where: { id: categoryId, userId, type: 'EXPENSE' },
  });
  if (!category) throw new AppError(404, 'Expense category not found');
};

const ensureOwned = async (userId: string, id: string) => {
  const budget = await prisma.budget.findFirst({ where: { id, userId } });
  if (!budget) throw new AppError(404, 'Budget not found');
  return budget;
};

export const create = async (
  userId: string,
  data: {
    limit: number;
    alertThreshold: number;
    month: number;
    year: number;
    categoryId: string;
  },
) => {
  await ensureExpenseCategory(userId, data.categoryId);
  return prisma.budget.create({
    data: { ...data, userId },
    include: { category: true },
  });
};

export const list = async (
  userId: string,
  query: { month?: number; year?: number; page: number; limit: number },
) => {
  const where = {
    userId,
    ...(query.month !== undefined ? { month: query.month } : {}),
    ...(query.year !== undefined ? { year: query.year } : {}),
  };
  const skip = (query.page - 1) * query.limit;
  const [items, total] = await Promise.all([
    prisma.budget.findMany({
      where,
      include: { category: true },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      skip,
      take: query.limit,
    }),
    prisma.budget.count({ where }),
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

export const update = async (
  userId: string,
  id: string,
  data: Partial<{
    limit: number;
    alertThreshold: number;
    month: number;
    year: number;
    categoryId: string;
  }>,
) => {
  await ensureOwned(userId, id);
  if (data.categoryId) await ensureExpenseCategory(userId, data.categoryId);
  return prisma.budget.update({
    where: { id },
    data,
    include: { category: true },
  });
};

export const alerts = async (userId: string) => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const budgets = await prisma.budget.findMany({
    where: { userId, month, year },
    include: { category: true },
  });

  return Promise.all(
    budgets.map(async (budget) => {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 1);
      const sum = await prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
          userId,
          categoryId: budget.categoryId,
          type: 'EXPENSE',
          date: { gte: start, lt: end },
        },
      });
      const spent = sum._sum.amount ?? 0;
      const percentUsed = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;
      return {
        ...budget,
        spent,
        percentUsed,
        thresholdCrossed: percentUsed >= budget.alertThreshold,
        overBudget: spent > budget.limit,
      };
    }),
  ).then((items) => items.filter((item) => item.thresholdCrossed));
};
