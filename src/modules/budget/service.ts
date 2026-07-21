import { prisma } from '../../config/db.js';
import type { Budget, Prisma } from '../../generated/prisma/client.js';
import {
  enforceLimit,
  getEntitlements,
} from '../../services/subscription.service.js';
import { AppError } from '../../utils/response.js';

type BudgetInput = {
  limit: number;
  alertThreshold: number;
  month: number;
  year: number;
  categoryId?: string | null;
  rollover: boolean;
};

const ensureExpenseCategory = async (userId: string, categoryId?: string | null) => {
  if (!categoryId) return;
  const category = await prisma.category.findFirst({
    where: {
      id: categoryId,
      type: 'EXPENSE',
      OR: [{ userId }, { userId: null }],
    },
  });
  if (!category) throw new AppError(400, 'Visible expense category not found');
};

const ensureOwned = async (userId: string, id: string) => {
  const budget = await prisma.budget.findFirst({ where: { id, userId } });
  if (!budget) throw new AppError(404, 'Budget not found');
  return budget;
};

const ensureUnique = async (
  userId: string,
  categoryId: string | null | undefined,
  month: number,
  year: number,
  excludeId?: string,
) => {
  const existing = await prisma.budget.findFirst({
    where: {
      userId,
      categoryId: categoryId ?? null,
      month,
      year,
      id: excludeId ? { not: excludeId } : undefined,
    },
  });
  if (existing) throw new AppError(409, 'A matching budget already exists');
};

const expenseWhere = (budget: Budget, start: Date, end: Date): Prisma.TransactionWhereInput => ({
  userId: budget.userId,
  type: 'EXPENSE',
  categoryId: budget.categoryId ?? undefined,
  date: { gte: start, lt: end },
});

const period = (year: number, month: number) => ({
  start: new Date(Date.UTC(year, month - 1, 1)),
  end: new Date(Date.UTC(year, month, 1)),
});

export const calculateBudgetProgress = async (budget: Budget) => {
  const { start, end } = period(budget.year, budget.month);
  const total = await prisma.transaction.aggregate({
    _sum: { amount: true },
    where: expenseWhere(budget, start, end),
  });
  const spent = total._sum?.amount?.toNumber() ?? 0;
  let rolledOver = 0;

  if (budget.rollover) {
    const previousDate = new Date(Date.UTC(budget.year, budget.month - 2, 1));
    const previous = await prisma.budget.findFirst({
      where: {
        userId: budget.userId,
        categoryId: budget.categoryId,
        month: previousDate.getUTCMonth() + 1,
        year: previousDate.getUTCFullYear(),
      },
    });
    if (previous) {
      const previousPeriod = period(previous.year, previous.month);
      const previousTotal = await prisma.transaction.aggregate({
        _sum: { amount: true },
        where: expenseWhere(previous, previousPeriod.start, previousPeriod.end),
      });
      rolledOver = Math.max(
        previous.limit.toNumber() - (previousTotal._sum?.amount?.toNumber() ?? 0),
        0,
      );
    }
  }

  const effectiveLimit = budget.limit.toNumber() + rolledOver;
  const percentUsed = effectiveLimit > 0 ? (spent / effectiveLimit) * 100 : 0;
  return {
    spent,
    rolledOver,
    effectiveLimit,
    percentUsed,
    thresholdCrossed: percentUsed >= budget.alertThreshold,
    overBudget: spent > effectiveLimit,
  };
};

export const create = async (userId: string, data: BudgetInput) => {
  const { limits } = await getEntitlements(userId);
  const count = await prisma.budget.count({ where: { userId } });
  enforceLimit(count, limits.maxBudgets, 'budgets');
  await ensureExpenseCategory(userId, data.categoryId);
  await ensureUnique(userId, data.categoryId, data.month, data.year);
  return prisma.budget.create({
    data: { ...data, userId, categoryId: data.categoryId ?? null },
    include: { category: true },
  });
};

export const list = async (
  userId: string,
  query: { month?: number; year?: number; page: number; limit: number },
) => {
  const where = { userId, month: query.month, year: query.year };
  const skip = (query.page - 1) * query.limit;
  const [budgets, total] = await Promise.all([
    prisma.budget.findMany({
      where,
      include: { category: true },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      skip,
      take: query.limit,
    }),
    prisma.budget.count({ where }),
  ]);
  const items = await Promise.all(
    budgets.map(async (budget) => ({
      ...budget,
      progress: await calculateBudgetProgress(budget),
    })),
  );
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
  data: Partial<BudgetInput>,
) => {
  const current = await ensureOwned(userId, id);
  const categoryId = data.categoryId !== undefined ? data.categoryId : current.categoryId;
  const month = data.month ?? current.month;
  const year = data.year ?? current.year;
  await ensureExpenseCategory(userId, categoryId);
  await ensureUnique(userId, categoryId, month, year, id);
  return prisma.budget.update({
    where: { id },
    data: { ...data, categoryId },
    include: { category: true },
  });
};

export const alerts = async (userId: string) => {
  const now = new Date();
  const budgets = await prisma.budget.findMany({
    where: { userId, month: now.getUTCMonth() + 1, year: now.getUTCFullYear() },
    include: { category: true },
  });
  const items = await Promise.all(
    budgets.map(async (budget) => ({
      ...budget,
      ...(await calculateBudgetProgress(budget)),
    })),
  );
  return items.filter((item) => item.thresholdCrossed);
};

export const remove = async (userId: string, id: string) => {
  await ensureOwned(userId, id);
  await prisma.budget.delete({ where: { id } });
};
