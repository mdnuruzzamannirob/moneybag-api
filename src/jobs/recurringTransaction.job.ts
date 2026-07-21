import cron from 'node-cron';
import { prisma } from '../config/db.js';
import { Prisma, type RecurringRule } from '../generated/prisma/client.js';
import { getEntitlements } from '../services/subscription.service.js';
import { invalidateUserReports } from '../modules/transaction/service.js';

const utcDateOnly = (date: Date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

const isDue = (source: Date, rule: RecurringRule, today: Date) => {
  const sourceDate = utcDateOnly(source);
  if (sourceDate >= today) return false;
  const days = Math.round((today.getTime() - sourceDate.getTime()) / 86400000);
  if (rule === 'DAILY') return true;
  if (rule === 'WEEKLY') return days % 7 === 0;

  const monthDifference =
    (today.getUTCFullYear() - sourceDate.getUTCFullYear()) * 12 +
    today.getUTCMonth() -
    sourceDate.getUTCMonth();
  if (monthDifference < 1) return false;
  const lastDay = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0),
  ).getUTCDate();
  return today.getUTCDate() === Math.min(sourceDate.getUTCDate(), lastDay);
};

export const runRecurringTransactionJob = async (runAt = new Date()) => {
  const today = utcDateOnly(runAt);
  const sources = await prisma.transaction.findMany({
    where: { isRecurring: true, recurringRule: { not: null } },
  });
  const affectedUsers = new Set<string>();

  for (const source of sources) {
    if (!source.recurringRule || !isDue(source.date, source.recurringRule, today)) {
      continue;
    }

    try {
      const { limits } = await getEntitlements(source.userId);
      await prisma.$transaction(
        async (tx) => {
          if (limits.maxTransactions !== null) {
            const start = new Date(
              Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1),
            );
            const end = new Date(
              Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 1),
            );
            const count = await tx.transaction.count({
              where: { userId: source.userId, date: { gte: start, lt: end } },
            });
            if (count >= limits.maxTransactions) {
              await tx.notification.upsert({
                where: {
                  dedupeKey: `recurring-limit:${source.id}:${today.toISOString().slice(0, 7)}`,
                },
                update: {},
                create: {
                  userId: source.userId,
                  type: 'SYSTEM',
                  title: 'Recurring transaction skipped',
                  message: 'Your monthly transaction limit has been reached.',
                  dedupeKey: `recurring-limit:${source.id}:${today.toISOString().slice(0, 7)}`,
                },
              });
              return;
            }
          }

          await tx.recurringOccurrence.create({
            data: { sourceTransactionId: source.id, occurrenceDate: today },
          });
          await tx.transaction.create({
            data: {
              amount: source.amount,
              type: source.type,
              note: source.note,
              date: today,
              tags: source.tags,
              userId: source.userId,
              categoryId: source.categoryId,
            },
          });
          affectedUsers.add(source.userId);
        },
        { isolationLevel: 'Serializable' },
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        continue;
      }
      throw error;
    }
  }

  await Promise.all([...affectedUsers].map(invalidateUserReports));
};

export const scheduleRecurringTransactionJob = () =>
  cron.schedule(
    '5 0 * * *',
    () => {
      void runRecurringTransactionJob();
    },
    { timezone: 'UTC', noOverlap: true, name: 'recurring-transactions' },
  );
