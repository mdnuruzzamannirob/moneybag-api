import { prisma } from '../../config/db.js';
import { redis } from '../../config/redis.js';
import { generateCsv } from '../../utils/csvGenerator.js';
import { generateReportPdf } from '../../utils/pdfGenerator.js';

const rangeForMonth = (month: number, year: number) => ({
  start: new Date(year, month - 1, 1),
  end: new Date(year, month, 1),
});

const cached = async <T>(key: string, factory: () => Promise<T>) => {
  const stored = await redis.get(key);
  if (stored) return JSON.parse(stored) as T;
  const value = await factory();
  await redis.set(key, JSON.stringify(value), 'EX', 300);
  return value;
};

const summaryForRange = async (userId: string, start: Date, end: Date) => {
  const [income, expense] = await Promise.all([
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { userId, type: 'INCOME', date: { gte: start, lt: end } },
    }),
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { userId, type: 'EXPENSE', date: { gte: start, lt: end } },
    }),
  ]);
  const totalIncome = income._sum.amount ?? 0;
  const totalExpense = expense._sum.amount ?? 0;
  return { totalIncome, totalExpense, netSavings: totalIncome - totalExpense };
};

export const monthly = async (userId: string, month: number, year: number) => {
  const key = `reports:${userId}:monthly:${year}:${month}`;
  return cached(key, async () => {
    const { start, end } = rangeForMonth(month, year);
    return summaryForRange(userId, start, end);
  });
};

export const yearly = async (userId: string, year: number) => {
  const key = `reports:${userId}:yearly:${year}`;
  return cached(key, async () =>
    summaryForRange(userId, new Date(year, 0, 1), new Date(year + 1, 0, 1)),
  );
};

export const categoryBreakdown = async (
  userId: string,
  month: number,
  year: number,
) => {
  const key = `reports:${userId}:category:${year}:${month}`;
  return cached(key, async () => {
    const { start, end } = rangeForMonth(month, year);
    const groups = await prisma.transaction.groupBy({
      by: ['categoryId'],
      _sum: { amount: true },
      where: { userId, type: 'EXPENSE', date: { gte: start, lt: end } },
    });
    const categories = await prisma.category.findMany({
      where: { id: { in: groups.map((group) => group.categoryId) } },
    });
    return groups.map((group) => ({
      categoryId: group.categoryId,
      categoryName:
        categories.find((category) => category.id === group.categoryId)?.name ??
        'Unknown',
      amount: group._sum.amount ?? 0,
    }));
  });
};

export const trend = async (userId: string, from: string, to: string) => {
  const key = `reports:${userId}:trend:${from}:${to}`;
  return cached(key, async () => {
    const transactions = await prisma.transaction.findMany({
      where: { userId, date: { gte: new Date(from), lte: new Date(to) } },
      orderBy: { date: 'asc' },
    });
    const byDate = new Map<
      string,
      { date: string; income: number; expense: number }
    >();
    for (const transaction of transactions) {
      const date = transaction.date.toISOString().slice(0, 10);
      const item = byDate.get(date) ?? { date, income: 0, expense: 0 };
      if (transaction.type === 'INCOME') item.income += transaction.amount;
      else item.expense += transaction.amount;
      byDate.set(date, item);
    }
    return [...byDate.values()];
  });
};

export const exportReport = async (
  userId: string,
  type: 'pdf' | 'csv',
  month: number,
  year: number,
) => {
  const data = await monthly(userId, month, year);
  if (type === 'csv') {
    return {
      contentType: 'text/csv',
      filename: `report-${year}-${month}.csv`,
      body: generateCsv([data]),
    };
  }
  const body = await generateReportPdf(`Expense Report ${year}-${month}`, [
    { label: 'Total income', value: data.totalIncome },
    { label: 'Total expense', value: data.totalExpense },
    { label: 'Net savings', value: data.netSavings },
  ]);
  return {
    contentType: 'application/pdf',
    filename: `report-${year}-${month}.pdf`,
    body,
  };
};
