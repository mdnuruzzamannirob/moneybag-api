import { prisma } from '../../config/db.js';
import { AppError } from '../../utils/response.js';

const withProgress = <
  T extends { currentAmount: number; targetAmount: number },
>(
  goal: T,
) => ({
  ...goal,
  progressPercent:
    goal.targetAmount > 0
      ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
      : 0,
});

const ensureOwned = async (userId: string, id: string) => {
  const goal = await prisma.savingsGoal.findFirst({ where: { id, userId } });
  if (!goal) throw new AppError(404, 'Savings goal not found');
  return goal;
};

export const create = async (
  userId: string,
  data: { title: string; targetAmount: number; deadline: string },
) =>
  withProgress(
    await prisma.savingsGoal.create({
      data: { ...data, deadline: new Date(data.deadline), userId },
    }),
  );

export const list = async (
  userId: string,
  query: { search?: string; page: number; limit: number },
) => {
  const where = {
    userId,
    ...(query.search
      ? {
          title: {
            contains: query.search,
            mode: 'insensitive' as const,
          },
        }
      : {}),
  };
  const skip = (query.page - 1) * query.limit;
  const [goals, total] = await Promise.all([
    prisma.savingsGoal.findMany({
      where,
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
  amount: number,
) => {
  await ensureOwned(userId, id);
  return withProgress(
    await prisma.savingsGoal.update({
      where: { id },
      data: { currentAmount: { increment: amount } },
    }),
  );
};

export const remove = async (userId: string, id: string) => {
  await ensureOwned(userId, id);
  await prisma.savingsGoal.delete({ where: { id } });
};
