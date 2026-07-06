import cron from 'node-cron';
import { prisma } from '../config/db.js';

const shouldRunToday = (rule: string | null, sourceDate: Date, now: Date) => {
  if (rule === 'DAILY') return true;
  if (rule === 'WEEKLY') return sourceDate.getDay() === now.getDay();
  if (rule === 'MONTHLY') return sourceDate.getDate() === now.getDate();
  return false;
};

export const runRecurringTransactionJob = async () => {
  const now = new Date();
  const recurringTransactions = await prisma.transaction.findMany({
    where: { isRecurring: true },
  });

  for (const transaction of recurringTransactions) {
    if (!shouldRunToday(transaction.recurringRule, transaction.date, now))
      continue;

    await prisma.transaction.create({
      data: {
        amount: transaction.amount,
        type: transaction.type,
        note: transaction.note,
        date: now,
        tags: transaction.tags,
        receiptUrl: transaction.receiptUrl,
        userId: transaction.userId,
        categoryId: transaction.categoryId,
      },
    });
  }
};

export const scheduleRecurringTransactionJob = () => {
  cron.schedule('5 0 * * *', () => {
    void runRecurringTransactionJob();
  });
};
