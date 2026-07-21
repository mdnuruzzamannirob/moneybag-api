import { prisma } from '../../config/db.js';
import {
  enforceLimit,
  getEntitlements,
} from '../../services/subscription.service.js';
import { AppError } from '../../utils/response.js';

const withProgress = <T extends { currentAmount: { toNumber(): number }; targetAmount: { toNumber(): number } }>(
  goal: T,
) => {
  const currentAmount = goal.currentAmount.toNumber();
  const targetAmount = goal.targetAmount.toNumber();
  return {
    ...goal,
    progressPercent:
      targetAmount > 0 ? Math.min((currentAmount / targetAmount) * 100, 100) : 0,
    remainingAmount: Math.max(targetAmount - currentAmount, 0),
  };
};

const ensureOwned = async (userId: string, id: string) => {
  const goal = await prisma.savingsGoal.findFirst({ where: { id, userId } });
  if (!goal) throw new AppError(404, 'Savings goal not found');
  return goal;
};

export const create = async (
  userId: string,
  data: { title: string; targetAmount: number; deadline: Date },
) => {
  const { limits } = await getEntitlements(userId);
  const count = await prisma.savingsGoal.count({ where: { userId } });
  enforceLimit(count, limits.maxSavingsGoals, 'savings goals');
  return withProgress(
    await prisma.savingsGoal.create({ data: { ...data, userId } }),
  );
};

export const list = async (
  userId: string,
  query: { search?: string; page: number; limit: number },
) => {
  const where = {
    userId,
    title: query.search
      ? { contains: query.search, mode: 'insensitive' as const }
      : undefined,
  };
  const skip = (query.page - 1) * query.limit;
  const [goals, total] = await Promise.all([
    prisma.savingsGoal.findMany({
      where,
      include: { contributions: { orderBy: { date: 'desc' } } },
      orderBy: { deadline: 'asc' },
      skip,
      take: query.limit,
    }),
    prisma.savingsGoal.count({ where }),
  ]);
  return {
    items: goals.map(withProgress),
    meta: {
      total,
      page: query.page,
      limit: query.limit,
      pages: Math.ceil(total / query.limit),
    },
  };
};

export const contribute = async (
  userId: string,
  id: string,
  input: { amount: number; date: Date; note?: string },
) => {
  await ensureOwned(userId, id);
  const goal = await prisma.$transaction(async (tx) => {
    await tx.savingsContribution.create({
      data: {
        goalId: id,
        amount: input.amount,
        date: input.date,
        note: input.note,
      },
    });
    return tx.savingsGoal.update({
      where: { id },
      data: { currentAmount: { increment: input.amount } },
      include: { contributions: { orderBy: { date: 'desc' } } },
    });
  });
  return withProgress(goal);
};

export const remove = async (userId: string, id: string) => {
  await ensureOwned(userId, id);
  await prisma.savingsGoal.delete({ where: { id } });
};
