import cron from 'node-cron';
import { prisma } from '../config/db.js';
import { ensureDefaultPlans } from '../services/subscription.service.js';

export const runSubscriptionTrialJob = async () => {
  await ensureDefaultPlans();
  const now = new Date();
  const [freePlan, expiredTrials] = await Promise.all([
    prisma.plan.findUniqueOrThrow({ where: { slug: 'free' } }),
    prisma.subscription.findMany({
      where: {
        status: 'TRIALING',
        stripeSubscriptionId: null,
        OR: [
          { currentPeriodEnd: { lte: now } },
          { user: { trialEndsAt: { lte: now } } },
        ],
      },
      select: { id: true, userId: true },
    }),
  ]);

  if (expiredTrials.length === 0) return 0;
  const subscriptionIds = expiredTrials.map((trial) => trial.id);
  const userIds = expiredTrials.map((trial) => trial.userId);

  await prisma.$transaction([
    prisma.subscription.updateMany({
      where: {
        id: { in: subscriptionIds },
        status: 'TRIALING',
        stripeSubscriptionId: null,
      },
      data: {
        planId: freePlan.id,
        status: 'ACTIVE',
        currentPeriodStart: now,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      },
    }),
    prisma.user.updateMany({
      where: { id: { in: userIds } },
      data: { trialEndsAt: null },
    }),
  ]);

  return expiredTrials.length;
};

export const scheduleSubscriptionTrialJob = () => {
  cron.schedule('15 * * * *', () => {
    void runSubscriptionTrialJob().catch((error: unknown) => {
      console.error('Subscription trial job failed', error);
    });
  });
};
