import { prisma } from '../../config/db.js';

const startOfUtcDay = (date: Date) =>
  new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );

const addUtcDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
};

const clampedUtcDate = (year: number, month: number, day: number) => {
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(day, lastDay)));
};

const nextOccurrenceDate = (
  sourceDate: Date,
  rule: 'DAILY' | 'WEEKLY' | 'MONTHLY',
  now: Date,
) => {
  const source = startOfUtcDay(sourceDate);
  const today = startOfUtcDay(now);
  if (source.getTime() > today.getTime()) return source;

  if (rule === 'DAILY') return addUtcDays(today, 1);
  if (rule === 'WEEKLY') {
    const dayDifference =
      (source.getUTCDay() - today.getUTCDay() + 7) % 7;
    return addUtcDays(today, dayDifference === 0 ? 7 : dayDifference);
  }

  const sourceDay = source.getUTCDate();
  let candidate = clampedUtcDate(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    sourceDay,
  );
  if (candidate.getTime() <= today.getTime()) {
    candidate = clampedUtcDate(
      today.getUTCFullYear(),
      today.getUTCMonth() + 1,
      sourceDay,
    );
  }
  return candidate;
};

const asNumber = (value: unknown) => Number(value ?? 0);
const money = (value: number) => Number(value.toFixed(2));

export const getDashboard = async (userId: string) => {
  const now = new Date();
  const year = now.getUTCFullYear();
  const monthIndex = now.getUTCMonth();
  const month = monthIndex + 1;
  const start = new Date(Date.UTC(year, monthIndex, 1));
  const end = new Date(Date.UTC(year, monthIndex + 1, 1));
  const periodFilter = { gte: start, lt: end };

  const [
    transactionTotals,
    recurringTransactions,
    budgets,
    categoryExpenseTotals,
    savingsGoals,
    savingsTotals,
    savingsGoalCount,
  ] = await Promise.all([
    prisma.transaction.groupBy({
      by: ['type'],
      where: { userId, date: periodFilter },
      _sum: { amount: true },
    }),
    prisma.transaction.findMany({
      where: {
        userId,
        isRecurring: true,
        recurringRule: { not: null },
      },
      select: {
        id: true,
        amount: true,
        type: true,
        date: true,
        note: true,
        tags: true,
        recurringRule: true,
        category: {
          select: { id: true, name: true, icon: true, color: true },
        },
      },
    }),
    prisma.budget.findMany({
      where: { userId, month, year },
      include: { category: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        userId,
        type: 'EXPENSE',
        date: periodFilter,
      },
      _sum: { amount: true },
    }),
    prisma.savingsGoal.findMany({
      where: { userId },
      orderBy: [{ deadline: 'asc' }, { createdAt: 'asc' }],
      take: 5,
    }),
    prisma.savingsGoal.aggregate({
      where: { userId },
      _sum: { targetAmount: true, currentAmount: true },
    }),
    prisma.savingsGoal.count({ where: { userId } }),
  ]);

  const income = asNumber(
    transactionTotals.find((total) => total.type === 'INCOME')?._sum.amount,
  );
  const expense = asNumber(
    transactionTotals.find((total) => total.type === 'EXPENSE')?._sum.amount,
  );
  const categorySpending = new Map(
    categoryExpenseTotals.map((total) => [
      total.categoryId,
      asNumber(total._sum.amount),
    ]),
  );

  const upcomingRecurringTransactions = recurringTransactions
    .map((transaction) => ({
      ...transaction,
      amount: asNumber(transaction.amount),
      nextOccurrenceDate: nextOccurrenceDate(
        transaction.date,
        transaction.recurringRule!,
        now,
      ),
    }))
    .sort(
      (left, right) =>
        left.nextOccurrenceDate.getTime() -
        right.nextOccurrenceDate.getTime(),
    )
    .slice(0, 5);

  const budgetProgress = budgets.map((budget) => {
    const limit = asNumber(budget.limit);
    const spent =
      budget.categoryId === null
        ? expense
        : (categorySpending.get(budget.categoryId) ?? 0);
    const percentUsed = limit > 0 ? (spent / limit) * 100 : 0;
    return {
      ...budget,
      limit,
      spent: money(spent),
      remaining: money(limit - spent),
      percentUsed: Number(percentUsed.toFixed(2)),
      thresholdCrossed: percentUsed >= budget.alertThreshold,
      overBudget: spent > limit,
    };
  });

  const savingsItems = savingsGoals.map((goal) => {
    const targetAmount = asNumber(goal.targetAmount);
    const currentAmount = asNumber(goal.currentAmount);
    return {
      ...goal,
      targetAmount,
      currentAmount,
      remainingAmount: money(Math.max(targetAmount - currentAmount, 0)),
      progressPercent:
        targetAmount > 0
          ? Number(
              Math.min((currentAmount / targetAmount) * 100, 100).toFixed(2),
            )
          : 0,
    };
  });

  return {
    period: {
      month,
      year,
      start,
      endExclusive: end,
    },
    monthlySummary: {
      income: money(income),
      expense: money(expense),
      net: money(income - expense),
    },
    upcomingRecurringTransactions,
    budgetProgress,
    savingsSnapshot: {
      totalGoals: savingsGoalCount,
      totalTargetAmount: money(
        asNumber(savingsTotals._sum.targetAmount),
      ),
      totalCurrentAmount: money(
        asNumber(savingsTotals._sum.currentAmount),
      ),
      goals: savingsItems,
    },
  };
};
