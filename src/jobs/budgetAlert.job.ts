import cron from 'node-cron';
import { prisma } from '../config/db.js';
import { calculateBudgetProgress } from '../modules/budget/service.js';
import { sendTemplateMail } from '../utils/mailer.js';

type Preferences = {
  emailBudgetAlerts?: boolean;
  inAppBudgetAlerts?: boolean;
};

export const runBudgetAlertJob = async (runAt = new Date()) => {
  const month = runAt.getUTCMonth() + 1;
  const year = runAt.getUTCFullYear();
  const budgets = await prisma.budget.findMany({
    where: { month, year },
    include: { category: true, user: true },
  });

  for (const budget of budgets) {
    const progress = await calculateBudgetProgress(budget);
    if (!progress.thresholdCrossed) continue;
    const preferences = budget.user.notificationPreferences as Preferences;
    const budgetName = budget.category?.name ?? 'Overall expenses';
    const dedupeKey = `budget-alert:${budget.id}:${year}-${month}`;

    let firstDelivery = false;
    if (preferences.inAppBudgetAlerts !== false) {
      const existing = await prisma.notification.findUnique({
        where: { dedupeKey },
      });
      if (!existing) {
        await prisma.notification.create({
          data: {
            userId: budget.userId,
            type: 'BUDGET_ALERT',
            title: `Budget alert: ${budgetName}`,
            message: `You have used ${progress.percentUsed.toFixed(1)}% of this budget.`,
            data: {
              budgetId: budget.id,
              spent: progress.spent,
              effectiveLimit: progress.effectiveLimit,
              percentUsed: progress.percentUsed,
            },
            dedupeKey,
          },
        });
        firstDelivery = true;
      }
    } else {
      const emailMarker = await prisma.notification.findUnique({
        where: { dedupeKey: `${dedupeKey}:email` },
      });
      if (!emailMarker) {
        await prisma.notification.create({
          data: {
            userId: budget.userId,
            type: 'BUDGET_ALERT',
            title: `Budget alert delivered: ${budgetName}`,
            message: 'Email-only alert delivery marker',
            dedupeKey: `${dedupeKey}:email`,
            readAt: new Date(),
          },
        });
        firstDelivery = true;
      }
    }

    if (firstDelivery && preferences.emailBudgetAlerts !== false) {
      await sendTemplateMail(
        'budget-alert',
        budget.user.email,
        {
          name: budget.user.name,
          budgetName,
          percentUsed: progress.percentUsed.toFixed(1),
          spent: progress.spent,
          limit: progress.effectiveLimit,
        },
        {
          subject: 'Budget alert: {{budgetName}}',
          body: '<p>You have used {{percentUsed}}% of your {{budgetName}} budget.</p>',
        },
      ).catch(() => undefined);
    }
  }
};

export const scheduleBudgetAlertJob = () =>
  cron.schedule(
    '0 8 * * *',
    () => {
      void runBudgetAlertJob();
    },
    { timezone: 'UTC', noOverlap: true, name: 'budget-alerts' },
  );
