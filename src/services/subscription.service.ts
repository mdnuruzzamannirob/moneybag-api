import { prisma } from '../config/db.js';
import type { Prisma } from '../generated/prisma/client.js';
import { AppError } from '../utils/response.js';

export type PlanLimits = {
  maxTransactions: number | null;
  maxBudgets: number | null;
  maxSavingsGoals: number | null;
  csvImport: boolean;
  receiptUpload: boolean;
  familySharing: boolean;
  maxFamilyMembers: number;
  fullReports: boolean;
  maxStorageMb: number | null;
};

export type PlanDefinition = {
  name: string;
  slug: 'free' | 'pro-monthly' | 'pro-yearly' | 'unlimited';
  description: string;
  price: string;
  interval: 'monthly' | 'yearly' | 'lifetime';
  limits: PlanLimits;
};

const unlimitedLimits: PlanLimits = {
  maxTransactions: null,
  maxBudgets: null,
  maxSavingsGoals: null,
  csvImport: true,
  receiptUpload: true,
  familySharing: true,
  maxFamilyMembers: 5,
  fullReports: true,
  maxStorageMb: null,
};

export const DEFAULT_PLANS: readonly PlanDefinition[] = [
  {
    name: 'Free',
    slug: 'free',
    description: 'Essential personal-finance tracking',
    price: '0.00',
    interval: 'lifetime',
    limits: {
      maxTransactions: 50,
      maxBudgets: 2,
      maxSavingsGoals: 1,
      csvImport: false,
      receiptUpload: false,
      familySharing: false,
      maxFamilyMembers: 0,
      fullReports: false,
      maxStorageMb: 5,
    },
  },
  {
    name: 'Pro Monthly',
    slug: 'pro-monthly',
    description: 'All Pro features, billed monthly',
    price: '4.99',
    interval: 'monthly',
    limits: unlimitedLimits,
  },
  {
    name: 'Pro Yearly',
    slug: 'pro-yearly',
    description: 'All Pro features, billed yearly',
    price: '49.99',
    interval: 'yearly',
    limits: unlimitedLimits,
  },
  {
    name: 'Unlimited',
    slug: 'unlimited',
    description: 'Lifetime access to all Pro features',
    price: '99.99',
    interval: 'lifetime',
    limits: unlimitedLimits,
  },
] as const;

const jsonLimits = (limits: PlanLimits) =>
  limits as unknown as Prisma.InputJsonValue;

export const ensureDefaultPlans = async () => {
  await Promise.all(
    DEFAULT_PLANS.map((plan) =>
      prisma.plan.upsert({
        where: { slug: plan.slug },
        update: {
          name: plan.name,
          description: plan.description,
          price: plan.price,
          interval: plan.interval,
          limits: jsonLimits(plan.limits),
        },
        create: {
          ...plan,
          limits: jsonLimits(plan.limits),
        },
      }),
    ),
  );
};

const numberOrNull = (value: unknown, fallback: number | null) =>
  value === null ? null : typeof value === 'number' ? value : fallback;

export const parsePlanLimits = (value: Prisma.JsonValue): PlanLimits => {
  const limits =
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, Prisma.JsonValue>)
      : {};

  return {
    maxTransactions: numberOrNull(limits.maxTransactions, 50),
    maxBudgets: numberOrNull(limits.maxBudgets, 2),
    maxSavingsGoals: numberOrNull(limits.maxSavingsGoals, 1),
    csvImport: limits.csvImport === true,
    receiptUpload: limits.receiptUpload === true,
    familySharing: limits.familySharing === true,
    maxFamilyMembers:
      typeof limits.maxFamilyMembers === 'number'
        ? limits.maxFamilyMembers
        : 0,
    fullReports: limits.fullReports === true,
    maxStorageMb: numberOrNull(limits.maxStorageMb, 5),
  };
};

const useFreePlan = async (userId: string) => {
  await ensureDefaultPlans();
  const freePlan = await prisma.plan.findUniqueOrThrow({
    where: { slug: 'free' },
  });
  const subscription = await prisma.subscription.upsert({
    where: { userId },
    update: {
      planId: freePlan.id,
      status: 'ACTIVE',
      currentPeriodStart: new Date(),
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      stripeSubscriptionId: null,
    },
    create: {
      userId,
      planId: freePlan.id,
      status: 'ACTIVE',
      currentPeriodStart: new Date(),
    },
    include: { plan: true },
  });
  await prisma.user.update({
    where: { id: userId },
    data: { trialEndsAt: null },
  });
  return subscription;
};

export const getEffectiveSubscription = async (userId: string) => {
  let subscription = await prisma.subscription.findUnique({
    where: { userId },
    include: { plan: true },
  });

  if (!subscription) return useFreePlan(userId);

  const expired =
    subscription.currentPeriodEnd !== null &&
    subscription.currentPeriodEnd.getTime() <= Date.now();
  if (
    (subscription.status === 'TRIALING' && expired) ||
    (subscription.status === 'CANCELED' && expired) ||
    subscription.status === 'INCOMPLETE'
  ) {
    subscription = await useFreePlan(userId);
  }

  return subscription;
};

export const getEntitlements = async (userId: string) => {
  const subscription = await getEffectiveSubscription(userId);
  return {
    subscription,
    plan: subscription.plan,
    limits: parsePlanLimits(subscription.plan.limits),
  };
};

export const requirePlanFeature = async (
  userId: string,
  feature: 'csvImport' | 'receiptUpload' | 'familySharing' | 'fullReports',
) => {
  const entitlements = await getEntitlements(userId);
  if (!entitlements.limits[feature]) {
    throw new AppError(403, 'This feature requires a Pro or Unlimited plan');
  }
  return entitlements;
};

export const enforceLimit = (
  currentCount: number,
  maximum: number | null,
  resourceName: string,
) => {
  if (maximum !== null && currentCount >= maximum) {
    throw new AppError(
      403,
      `Your current plan limit for ${resourceName} has been reached`,
    );
  }
};
