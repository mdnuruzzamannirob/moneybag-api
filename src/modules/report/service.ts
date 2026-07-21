import { prisma } from '../../config/db.js';
import { redis } from '../../config/redis.js';
import { requirePlanFeature } from '../../services/subscription.service.js';
import { generateCsv } from '../../utils/csvGenerator.js';
import { generateReportPdf } from '../../utils/pdfGenerator.js';

const rangeForMonth = (month: number, year: number) => ({
  start: new Date(Date.UTC(year, month - 1, 1)),
  end: new Date(Date.UTC(year, month, 1)),
});

const cached = async <T>(key: string, factory: () => Promise<T>) => {
  try {
    const stored = await redis.get(key);
    if (stored) return JSON.parse(stored) as T;
  } catch {
    // Reports remain available when Redis is degraded.
  }
  const value = await factory();
  try {
    await redis.set(key, JSON.stringify(value), 'EX', 300);
  } catch {
    // The database result is still authoritative.
  }
  return value;
};

const summaryForRange = async (userId: string, start: Date, end: Date) => {
  const groups = await prisma.transaction.groupBy({
    by: ['type'],
    _sum: { amount: true },
    where: { userId, date: { gte: start, lt: end } },
  });
  const totalIncome =
    groups.find((group) => group.type === 'INCOME')?._sum.amount?.toNumber() ?? 0;
  const totalExpense =
    groups.find((group) => group.type === 'EXPENSE')?._sum.amount?.toNumber() ?? 0;
  return { totalIncome, totalExpense, netSavings: totalIncome - totalExpense };
};

export const monthly = async (userId: string, month: number, year: number) =>
  cached(`reports:${userId}:monthly:${year}:${month}`, async () => {
    const { start, end } = rangeForMonth(month, year);
    return summaryForRange(userId, start, end);
  });

export const yearly = async (userId: string, year: number) =>
  cached(`reports:${userId}:yearly:${year}`, async () => {
    const months = await Promise.all(
      Array.from({ length: 12 }, async (_, index) => ({
        month: index + 1,
        ...(await summaryForRange(
          userId,
          new Date(Date.UTC(year, index, 1)),
          new Date(Date.UTC(year, index + 1, 1)),
        )),
      })),
    );
    return {
      totalIncome: months.reduce((sum, item) => sum + item.totalIncome, 0),
      totalExpense: months.reduce((sum, item) => sum + item.totalExpense, 0),
      netSavings: months.reduce((sum, item) => sum + item.netSavings, 0),
      months,
    };
  });

export const categoryBreakdown = async (
  userId: string,
  month: number,
  year: number,
) =>
  cached(`reports:${userId}:category:${year}:${month}`, async () => {
    const { start, end } = rangeForMonth(month, year);
    const groups = await prisma.transaction.groupBy({
      by: ['categoryId'],
      _sum: { amount: true },
      where: { userId, type: 'EXPENSE', date: { gte: start, lt: end } },
    });
    const categories = await prisma.category.findMany({
      where: { id: { in: groups.map((group) => group.categoryId) } },
      select: { id: true, name: true, icon: true, color: true },
    });
    const total = groups.reduce(
      (sum, group) => sum + (group._sum.amount?.toNumber() ?? 0),
      0,
    );
    return groups.map((group) => {
      const amount = group._sum.amount?.toNumber() ?? 0;
      const category = categories.find((item) => item.id === group.categoryId);
      return {
        categoryId: group.categoryId,
        categoryName: category?.name ?? 'Unknown',
        icon: category?.icon ?? null,
        color: category?.color ?? null,
        amount,
        percentage: total > 0 ? (amount / total) * 100 : 0,
      };
    });
  });

export const trend = async (userId: string, from: Date, to: Date) => {
  await requirePlanFeature(userId, 'fullReports');
  const fromKey = from.toISOString().slice(0, 10);
  const toKey = to.toISOString().slice(0, 10);
  return cached(`reports:${userId}:trend:${fromKey}:${toKey}`, async () => {
    const inclusiveEnd = new Date(Date.UTC(
      to.getUTCFullYear(),
      to.getUTCMonth(),
      to.getUTCDate() + 1,
    ));
    const transactions = await prisma.transaction.findMany({
      where: { userId, date: { gte: from, lt: inclusiveEnd } },
      orderBy: { date: 'asc' },
    });
    const byDate = new Map<string, { income: number; expense: number }>();
    for (const transaction of transactions) {
      const key = transaction.date.toISOString().slice(0, 10);
      const item = byDate.get(key) ?? { income: 0, expense: 0 };
      if (transaction.type === 'INCOME') item.income += transaction.amount.toNumber();
      else item.expense += transaction.amount.toNumber();
      byDate.set(key, item);
    }

    const items = [];
    for (
      let cursor = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
      cursor < inclusiveEnd;
      cursor = new Date(cursor.getTime() + 86400000)
    ) {
      const date = cursor.toISOString().slice(0, 10);
      const item = byDate.get(date) ?? { income: 0, expense: 0 };
      items.push({ date, ...item, net: item.income - item.expense });
    }
    return items;
  });
};

export const exportReport = async (
  userId: string,
  type: 'pdf' | 'csv',
  month: number,
  year: number,
) => {
  await requirePlanFeature(userId, 'fullReports');
  const data = await monthly(userId, month, year);
  if (type === 'csv') {
    return {
      contentType: 'text/csv',
      filename: `report-${year}-${month}.csv`,
      body: generateCsv([data]),
    };
  }
  return {
    contentType: 'application/pdf',
    filename: `report-${year}-${month}.pdf`,
    body: await generateReportPdf(`MoneyBag Report ${year}-${month}`, [
      { label: 'Total income', value: data.totalIncome },
      { label: 'Total expense', value: data.totalExpense },
      { label: 'Net savings', value: data.netSavings },
    ]),
  };
};
