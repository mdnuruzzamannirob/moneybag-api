import cron from 'node-cron';
import { prisma } from '../config/db.js';
import { sendMail } from '../utils/mailer.js';

export const runBudgetAlertJob = async () => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const budgets = await prisma.budget.findMany({
    where: { month, year },
    include: { category: true, user: true },
  });

  for (const budget of budgets) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);
    const total = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        userId: budget.userId,
        categoryId: budget.categoryId,
        type: 'EXPENSE',
        date: { gte: start, lt: end },
      },
    });
    const spent = total._sum.amount ?? 0;
    const usedPercent = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;

    if (usedPercent >= budget.alertThreshold) {
      await sendMail(
        budget.user.email,
        `Budget alert: ${budget.category.name}`,
        `You have used ${usedPercent.toFixed(1)}% of your ${budget.category.name} budget.`,
      );
    }
  }
};

export const scheduleBudgetAlertJob = () => {
  cron.schedule('0 8 * * *', () => {
    void runBudgetAlertJob();
  });
};
