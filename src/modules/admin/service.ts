import { randomUUID } from 'node:crypto';
import { prisma } from '../../config/db.js';
import { Prisma } from '../../generated/prisma/client.js';
import { recordAudit } from '../../services/audit.service.js';
import { signAccessToken } from '../../utils/jwt.js';
import { AppError } from '../../utils/response.js';

type SubscriptionStatus =
  'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'TRIALING' | 'INCOMPLETE' | 'LIFETIME';
type SortOrder = 'asc' | 'desc';
type TransactionType = 'INCOME' | 'EXPENSE';

export type AuditContext = {
  actorId: string;
  ipAddress?: string;
  userAgent?: string;
};

export type ListUsersQuery = {
  search?: string;
  role?: 'USER' | 'ADMIN';
  isActive?: boolean;
  status?: boolean;
  planId?: string;
  plan?: string;
  subscriptionStatus?: SubscriptionStatus;
  sortBy: 'createdAt' | 'name' | 'email' | 'lastLoginAt';
  sortOrder: SortOrder;
  page: number;
  limit: number;
};

export type ListSubscriptionsQuery = {
  search?: string;
  status?: SubscriptionStatus;
  planId?: string;
  plan?: string;
  cancelAtPeriodEnd?: boolean;
  sortBy: 'createdAt' | 'updatedAt' | 'currentPeriodEnd' | 'status';
  sortOrder: SortOrder;
  page: number;
  limit: number;
};

export type ListPlansQuery = {
  search?: string;
  isActive?: boolean;
  interval?: 'monthly' | 'yearly' | 'lifetime';
  page: number;
  limit: number;
};

export type PlanInput = {
  name: string;
  slug: string;
  description?: string | null;
  price: string | number;
  interval: 'monthly' | 'yearly' | 'lifetime';
  limits: Record<string, unknown>;
  stripePriceId?: string | null;
  isActive?: boolean;
};

export type GlobalCategoryInput = {
  name: string;
  type: TransactionType;
  icon?: string | null;
  color?: string | null;
};

export type ListGlobalCategoriesQuery = {
  search?: string;
  type?: TransactionType;
  page: number;
  limit: number;
};

export type ListAuditLogsQuery = {
  search?: string;
  userId?: string;
  action?: string;
  from?: Date;
  to?: Date;
  page: number;
  limit: number;
};

export type ListEmailTemplatesQuery = {
  search?: string;
  page: number;
  limit: number;
};

type StripeRecord = Record<string, unknown>;
type StripeClientLike = {
  subscriptions: {
    retrieve: (
      id: string,
      params?: Record<string, unknown>,
    ) => Promise<StripeRecord>;
    update: (
      id: string,
      params: Record<string, unknown>,
    ) => Promise<StripeRecord>;
    cancel: (id: string) => Promise<StripeRecord>;
  };
  refunds: {
    create: (params: Record<string, unknown>) => Promise<StripeRecord>;
  };
};

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
  currency: true,
  theme: true,
  notificationPreferences: true,
  role: true,
  isActive: true,
  twoFactorEnabled: true,
  trialEndsAt: true,
  stripeCustomerId: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
  subscription: {
    select: {
      id: true,
      status: true,
      currentPeriodStart: true,
      currentPeriodEnd: true,
      cancelAtPeriodEnd: true,
      createdAt: true,
      updatedAt: true,
      plan: {
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          interval: true,
          limits: true,
          isActive: true,
        },
      },
    },
  },
} satisfies Prisma.UserSelect;

const subscriptionSelect = {
  id: true,
  userId: true,
  planId: true,
  stripeSubscriptionId: true,
  status: true,
  currentPeriodStart: true,
  currentPeriodEnd: true,
  cancelAtPeriodEnd: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
      stripeCustomerId: true,
    },
  },
  plan: {
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      interval: true,
      limits: true,
      isActive: true,
      stripePriceId: true,
    },
  },
} satisfies Prisma.SubscriptionSelect;

const pageMeta = (total: number, page: number, limit: number) => ({
  total,
  page,
  limit,
  pages: Math.ceil(total / limit),
});

const asJson = (value: Record<string, unknown>) =>
  value as Prisma.InputJsonValue;

const audit = async (
  context: AuditContext,
  action: string,
  details: Record<string, unknown>,
) => {
  await recordAudit({
    userId: context.actorId,
    action,
    details: asJson(details),
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });
};

const addUtcMonths = (date: Date, months: number) => {
  const result = new Date(date);
  const originalDay = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);
  const lastDay = new Date(
    Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0),
  ).getUTCDate();
  result.setUTCDate(Math.min(originalDay, lastDay));
  return result;
};

const subscriptionDefaults = (
  plan: { slug: string; interval: string },
  now = new Date(),
) => ({
  status: (plan.slug === 'free'
    ? 'ACTIVE'
    : plan.interval === 'lifetime'
      ? 'LIFETIME'
      : 'ACTIVE') as SubscriptionStatus,
  currentPeriodStart: now,
  currentPeriodEnd:
    plan.interval === 'monthly'
      ? addUtcMonths(now, 1)
      : plan.interval === 'yearly'
        ? addUtcMonths(now, 12)
        : null,
  cancelAtPeriodEnd: false,
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isStripeClient = (value: unknown): value is StripeClientLike => {
  if (!isRecord(value)) return false;
  const subscriptions = value.subscriptions;
  const refunds = value.refunds;
  return (
    isRecord(subscriptions) &&
    typeof subscriptions.retrieve === 'function' &&
    typeof subscriptions.update === 'function' &&
    typeof subscriptions.cancel === 'function' &&
    isRecord(refunds) &&
    typeof refunds.create === 'function'
  );
};

let stripeClientPromise: Promise<StripeClientLike | null> | undefined;

const getStripeClient = () => {
  stripeClientPromise ??= (async () => {
    try {
      // Keep Stripe optional: deployments without billing configuration can
      // still use manually-managed plans and subscriptions.
      const modulePath = '../../config/stripe.js';
      const stripeModule = (await import(modulePath)) as Record<
        string,
        unknown
      >;
      const candidate = stripeModule.stripe ?? stripeModule.default;
      return isStripeClient(candidate) ? candidate : null;
    } catch {
      return null;
    }
  })();
  return stripeClientPromise;
};

const requireStripeClient = async () => {
  const stripe = await getStripeClient();
  if (!stripe) {
    throw new AppError(503, 'Stripe is not configured for this deployment');
  }
  return stripe;
};

const objectId = (value: unknown) => {
  if (typeof value === 'string') return value;
  if (isRecord(value) && typeof value.id === 'string') return value.id;
  return null;
};

export const stats = async () => {
  const now = new Date();
  const startOfToday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);

  const [
    totalUsers,
    activeUsers,
    activeToday,
    newRegistrationsToday,
    newRegistrationsLast30Days,
    activeTrials,
    totalSubscriptions,
    paidSubscriptions,
    plans,
    transactions,
    transactionVolume,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({ where: { lastLoginAt: { gte: startOfToday } } }),
    prisma.user.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.subscription.count({
      where: {
        status: 'TRIALING',
        OR: [{ currentPeriodEnd: null }, { currentPeriodEnd: { gt: now } }],
      },
    }),
    prisma.subscription.count(),
    prisma.subscription.findMany({
      where: { status: { in: ['ACTIVE', 'PAST_DUE'] } },
      select: {
        plan: {
          select: { slug: true, price: true, interval: true },
        },
      },
    }),
    prisma.plan.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        _count: { select: { subscriptions: true } },
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.transaction.count(),
    prisma.transaction.aggregate({ _sum: { amount: true } }),
  ]);

  const mrr = paidSubscriptions.reduce((total, subscription) => {
    if (
      subscription.plan.slug === 'free' ||
      subscription.plan.interval === 'lifetime'
    ) {
      return total;
    }
    const price = Number(subscription.plan.price.toString());
    return (
      total + (subscription.plan.interval === 'yearly' ? price / 12 : price)
    );
  }, 0);

  return {
    totalUsers,
    usersCount: totalUsers,
    activeUsers,
    inactiveUsers: totalUsers - activeUsers,
    activeToday,
    activeTrials,
    newRegistrations: newRegistrationsLast30Days,
    newRegistrationsToday,
    newRegistrationsLast30Days,
    totalSubscriptions,
    mrr: Number(mrr.toFixed(2)),
    subscriptionsByPlan: plans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      slug: plan.slug,
      isActive: plan.isActive,
      count: plan._count.subscriptions,
    })),
    totalTransactions: transactions,
    transactionsCount: transactions,
    totalTransactionVolume: transactionVolume._sum.amount ?? 0,
    totalVolume: transactionVolume._sum.amount ?? 0,
  };
};

export const users = async (query: ListUsersQuery) => {
  const activeFilter = query.isActive ?? query.status;
  const subscriptionFilter =
    query.planId || query.plan || query.subscriptionStatus
      ? {
          is: {
            ...(query.planId ? { planId: query.planId } : {}),
            ...(query.plan ? { plan: { is: { slug: query.plan } } } : {}),
            ...(query.subscriptionStatus
              ? { status: query.subscriptionStatus }
              : {}),
          },
        }
      : undefined;
  const where: Prisma.UserWhereInput = {
    ...(query.role ? { role: query.role } : {}),
    ...(activeFilter !== undefined ? { isActive: activeFilter } : {}),
    ...(subscriptionFilter ? { subscription: subscriptionFilter } : {}),
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: 'insensitive' } },
            { email: { contains: query.search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };
  const skip = (query.page - 1) * query.limit;
  const orderBy = {
    [query.sortBy]: query.sortOrder,
  } as Prisma.UserOrderByWithRelationInput;
  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: safeUserSelect,
      orderBy,
      skip,
      take: query.limit,
    }),
    prisma.user.count({ where }),
  ]);

  return { items, meta: pageMeta(total, query.page, query.limit) };
};

export const userDetail = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      ...safeUserSelect,
      _count: {
        select: {
          transactions: true,
          budgets: true,
          savingsGoals: true,
          ownedFamilyGroups: true,
          familyMemberships: true,
          notifications: true,
        },
      },
    },
  });
  if (!user) throw new AppError(404, 'User not found');
  return user;
};

export const updateStatus = async (
  id: string,
  isActive: boolean,
  context: AuditContext,
) => {
  if (id === context.actorId && !isActive) {
    throw new AppError(
      409,
      'You cannot deactivate your own administrator account',
    );
  }
  const exists = await prisma.user.findUnique({
    where: { id },
    select: { id: true, isActive: true },
  });
  if (!exists) throw new AppError(404, 'User not found');

  const [user] = await prisma.$transaction([
    prisma.user.update({
      where: { id },
      data: { isActive },
      select: safeUserSelect,
    }),
    ...(!isActive
      ? [
          prisma.refreshToken.updateMany({
            where: { userId: id, revoked: false },
            data: { revoked: true },
          }),
        ]
      : []),
  ]);
  await audit(context, 'ADMIN_USER_STATUS_UPDATED', {
    targetUserId: id,
    previousIsActive: exists.isActive,
    isActive,
  });
  return user;
};

export const impersonate = async (id: string, context: AuditContext) => {
  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });
  if (!target) throw new AppError(404, 'User not found');
  if (!target.isActive)
    throw new AppError(409, 'Inactive users cannot be impersonated');
  if (target.role === 'ADMIN' && target.id !== context.actorId) {
    throw new AppError(
      403,
      'Administrators cannot impersonate another administrator',
    );
  }

  const accessToken = signAccessToken({
    sub: target.id,
    email: target.email,
    role: target.role,
    jti: `impersonation:${context.actorId}:${randomUUID()}`,
  });
  await audit(context, 'ADMIN_USER_IMPERSONATED', { targetUserId: id });
  return {
    accessToken,
    tokenType: 'Bearer',
    user: target,
  };
};

export const assignPlan = async (
  userId: string,
  planId: string,
  context: AuditContext,
) => {
  const [user, plan, previous] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { id: true } }),
    prisma.plan.findUnique({ where: { id: planId } }),
    prisma.subscription.findUnique({
      where: { userId },
      select: { planId: true, status: true },
    }),
  ]);
  if (!user) throw new AppError(404, 'User not found');
  if (!plan) throw new AppError(404, 'Plan not found');
  if (!plan.isActive)
    throw new AppError(409, 'Archived plans cannot be assigned');

  const defaults = subscriptionDefaults(plan);
  const [subscription] = await prisma.$transaction([
    prisma.subscription.upsert({
      where: { userId },
      update: { planId, ...defaults },
      create: { userId, planId, ...defaults },
      select: subscriptionSelect,
    }),
    prisma.user.update({
      where: { id: userId },
      data: { trialEndsAt: null },
      select: { id: true },
    }),
  ]);
  await audit(context, 'ADMIN_USER_PLAN_ASSIGNED', {
    targetUserId: userId,
    planId,
    previousPlanId: previous?.planId ?? null,
    previousStatus: previous?.status ?? null,
    status: defaults.status,
  });
  return subscription;
};

export const subscriptions = async (query: ListSubscriptionsQuery) => {
  const where: Prisma.SubscriptionWhereInput = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.planId ? { planId: query.planId } : {}),
    ...(query.cancelAtPeriodEnd !== undefined
      ? { cancelAtPeriodEnd: query.cancelAtPeriodEnd }
      : {}),
    ...(query.plan ? { plan: { is: { slug: query.plan } } } : {}),
    ...(query.search
      ? {
          user: {
            is: {
              OR: [
                { name: { contains: query.search, mode: 'insensitive' } },
                { email: { contains: query.search, mode: 'insensitive' } },
              ],
            },
          },
        }
      : {}),
  };
  const orderBy = {
    [query.sortBy]: query.sortOrder,
  } as Prisma.SubscriptionOrderByWithRelationInput;
  const skip = (query.page - 1) * query.limit;
  const [items, total] = await Promise.all([
    prisma.subscription.findMany({
      where,
      select: subscriptionSelect,
      orderBy,
      skip,
      take: query.limit,
    }),
    prisma.subscription.count({ where }),
  ]);
  return { items, meta: pageMeta(total, query.page, query.limit) };
};

export const refundSubscription = async (
  id: string,
  input: {
    amount?: number;
    reason: 'duplicate' | 'fraudulent' | 'requested_by_customer';
  },
  context: AuditContext,
) => {
  const subscription = await prisma.subscription.findUnique({
    where: { id },
    select: subscriptionSelect,
  });
  if (!subscription) throw new AppError(404, 'Subscription not found');
  if (!subscription.stripeSubscriptionId) {
    throw new AppError(
      409,
      'This subscription has no Stripe payment to refund',
    );
  }

  const stripe = await requireStripeClient();
  const stripeSubscription = await stripe.subscriptions.retrieve(
    subscription.stripeSubscriptionId,
    { expand: ['latest_invoice.payment_intent'] },
  );
  const latestInvoice = stripeSubscription.latest_invoice;
  const invoice = isRecord(latestInvoice) ? latestInvoice : null;
  const paymentIntentId = objectId(invoice?.payment_intent);
  const chargeId = objectId(invoice?.charge);
  if (!paymentIntentId && !chargeId) {
    throw new AppError(409, 'No refundable Stripe payment was found');
  }

  const refundParams: Record<string, unknown> = {
    reason: input.reason,
    ...(paymentIntentId
      ? { payment_intent: paymentIntentId }
      : { charge: chargeId }),
    ...(input.amount !== undefined
      ? { amount: Math.round(input.amount * 100) }
      : {}),
  };
  const refund = await stripe.refunds.create(refundParams);
  await audit(context, 'ADMIN_SUBSCRIPTION_REFUNDED', {
    subscriptionId: id,
    stripeSubscriptionId: subscription.stripeSubscriptionId,
    refundId: objectId(refund),
    amount: input.amount ?? null,
    reason: input.reason,
  });
  return {
    id: objectId(refund),
    status: typeof refund.status === 'string' ? refund.status : null,
    amount:
      typeof refund.amount === 'number'
        ? Number((refund.amount / 100).toFixed(2))
        : null,
    amountMinor: typeof refund.amount === 'number' ? refund.amount : null,
    currency: typeof refund.currency === 'string' ? refund.currency : null,
    subscription,
  };
};

export const cancelSubscription = async (
  id: string,
  atPeriodEnd: boolean,
  context: AuditContext,
) => {
  const current = await prisma.subscription.findUnique({
    where: { id },
    select: subscriptionSelect,
  });
  if (!current) throw new AppError(404, 'Subscription not found');
  if (
    current.status === 'CANCELED' &&
    current.cancelAtPeriodEnd === atPeriodEnd
  ) {
    return current;
  }
  if (atPeriodEnd && !current.currentPeriodEnd) {
    throw new AppError(
      409,
      'This subscription has no renewable billing period',
    );
  }

  if (current.stripeSubscriptionId) {
    const stripe = await requireStripeClient();
    if (atPeriodEnd) {
      await stripe.subscriptions.update(current.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
    } else {
      await stripe.subscriptions.cancel(current.stripeSubscriptionId);
    }
  }

  const subscription = await prisma.subscription.update({
    where: { id },
    data: atPeriodEnd
      ? { status: 'CANCELED', cancelAtPeriodEnd: true }
      : {
          status: 'CANCELED',
          cancelAtPeriodEnd: false,
          currentPeriodEnd: new Date(),
        },
    select: subscriptionSelect,
  });
  await audit(context, 'ADMIN_SUBSCRIPTION_CANCELED', {
    subscriptionId: id,
    atPeriodEnd,
  });
  return subscription;
};

export const reactivateSubscription = async (
  id: string,
  context: AuditContext,
) => {
  const current = await prisma.subscription.findUnique({
    where: { id },
    select: subscriptionSelect,
  });
  if (!current) throw new AppError(404, 'Subscription not found');
  if (
    current.status === 'CANCELED' &&
    current.currentPeriodEnd &&
    current.currentPeriodEnd.getTime() <= Date.now() &&
    current.stripeSubscriptionId
  ) {
    throw new AppError(
      409,
      'A fully canceled Stripe subscription cannot be reactivated',
    );
  }

  if (current.stripeSubscriptionId) {
    const stripe = await requireStripeClient();
    await stripe.subscriptions.update(current.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });
  }

  const defaults = subscriptionDefaults(current.plan);
  const subscription = await prisma.subscription.update({
    where: { id },
    data: {
      status: defaults.status,
      cancelAtPeriodEnd: false,
      ...(current.currentPeriodEnd && current.currentPeriodEnd > new Date()
        ? {}
        : {
            currentPeriodStart: defaults.currentPeriodStart,
            currentPeriodEnd: defaults.currentPeriodEnd,
          }),
    },
    select: subscriptionSelect,
  });
  await audit(context, 'ADMIN_SUBSCRIPTION_REACTIVATED', {
    subscriptionId: id,
    status: defaults.status,
  });
  return subscription;
};

export const plans = async (query: ListPlansQuery) => {
  const where: Prisma.PlanWhereInput = {
    ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
    ...(query.interval ? { interval: query.interval } : {}),
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: 'insensitive' } },
            { slug: { contains: query.search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };
  const skip = (query.page - 1) * query.limit;
  const [items, total] = await Promise.all([
    prisma.plan.findMany({
      where,
      include: { _count: { select: { subscriptions: true } } },
      orderBy: { createdAt: 'asc' },
      skip,
      take: query.limit,
    }),
    prisma.plan.count({ where }),
  ]);
  return { items, meta: pageMeta(total, query.page, query.limit) };
};

export const createPlan = async (input: PlanInput, context: AuditContext) => {
  const plan = await prisma.plan.create({
    data: {
      name: input.name,
      slug: input.slug,
      description: input.description,
      price: input.price,
      interval: input.interval,
      limits: input.limits as Prisma.InputJsonValue,
      stripePriceId: input.stripePriceId,
      isActive: input.isActive ?? true,
    },
  });
  await audit(context, 'ADMIN_PLAN_CREATED', {
    planId: plan.id,
    slug: plan.slug,
  });
  return plan;
};

export const updatePlan = async (
  id: string,
  input: Partial<PlanInput>,
  context: AuditContext,
) => {
  const current = await prisma.plan.findUnique({ where: { id } });
  if (!current) throw new AppError(404, 'Plan not found');
  if (current.slug === 'free' && input.isActive === false) {
    throw new AppError(409, 'The Free plan cannot be archived');
  }

  const data: Prisma.PlanUpdateInput = {
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.slug !== undefined ? { slug: input.slug } : {}),
    ...(input.description !== undefined
      ? { description: input.description }
      : {}),
    ...(input.price !== undefined ? { price: input.price } : {}),
    ...(input.interval !== undefined ? { interval: input.interval } : {}),
    ...(input.limits !== undefined
      ? { limits: input.limits as Prisma.InputJsonValue }
      : {}),
    ...(input.stripePriceId !== undefined
      ? { stripePriceId: input.stripePriceId }
      : {}),
    ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
  };
  const plan = await prisma.plan.update({ where: { id }, data });
  await audit(context, 'ADMIN_PLAN_UPDATED', {
    planId: id,
    changedFields: Object.keys(input),
  });
  return plan;
};

export const archivePlan = async (id: string, context: AuditContext) => {
  const current = await prisma.plan.findUnique({
    where: { id },
    select: { id: true, slug: true, isActive: true },
  });
  if (!current) throw new AppError(404, 'Plan not found');
  if (current.slug === 'free') {
    throw new AppError(409, 'The Free plan cannot be archived');
  }
  const plan = await prisma.plan.update({
    where: { id },
    data: { isActive: false },
  });
  await audit(context, 'ADMIN_PLAN_ARCHIVED', {
    planId: id,
    wasActive: current.isActive,
  });
  return plan;
};

export const globalCategories = async (query: ListGlobalCategoriesQuery) => {
  const where: Prisma.CategoryWhereInput = {
    userId: null,
    ...(query.type ? { type: query.type } : {}),
    ...(query.search
      ? { name: { contains: query.search, mode: 'insensitive' } }
      : {}),
  };
  const skip = (query.page - 1) * query.limit;
  const [items, total] = await Promise.all([
    prisma.category.findMany({
      where,
      include: {
        _count: { select: { transactions: true, budgets: true } },
      },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
      skip,
      take: query.limit,
    }),
    prisma.category.count({ where }),
  ]);
  return { items, meta: pageMeta(total, query.page, query.limit) };
};

const assertUniqueGlobalCategory = async (
  input: { name: string; type: TransactionType },
  excludedId?: string,
) => {
  const duplicate = await prisma.category.findFirst({
    where: {
      userId: null,
      type: input.type,
      name: { equals: input.name, mode: 'insensitive' },
      ...(excludedId ? { id: { not: excludedId } } : {}),
    },
    select: { id: true },
  });
  if (duplicate) {
    throw new AppError(
      409,
      'A global category with this name and type already exists',
    );
  }
};

export const createGlobalCategory = async (
  input: GlobalCategoryInput,
  context: AuditContext,
) => {
  await assertUniqueGlobalCategory(input);
  const category = await prisma.category.create({
    data: { ...input, userId: null },
  });
  await audit(context, 'ADMIN_GLOBAL_CATEGORY_CREATED', {
    categoryId: category.id,
    name: category.name,
    type: category.type,
  });
  return category;
};

export const updateGlobalCategory = async (
  id: string,
  input: Partial<GlobalCategoryInput>,
  context: AuditContext,
) => {
  const current = await prisma.category.findFirst({
    where: { id, userId: null },
  });
  if (!current) throw new AppError(404, 'Global category not found');
  await assertUniqueGlobalCategory(
    {
      name: input.name ?? current.name,
      type: input.type ?? current.type,
    },
    id,
  );
  const category = await prisma.category.update({
    where: { id },
    data: input,
  });
  await audit(context, 'ADMIN_GLOBAL_CATEGORY_UPDATED', {
    categoryId: id,
    changedFields: Object.keys(input),
  });
  return category;
};

export const deleteGlobalCategory = async (
  id: string,
  context: AuditContext,
) => {
  const category = await prisma.category.findFirst({
    where: { id, userId: null },
    select: {
      id: true,
      name: true,
      type: true,
      _count: { select: { transactions: true, budgets: true } },
    },
  });
  if (!category) throw new AppError(404, 'Global category not found');
  if (category._count.transactions > 0 || category._count.budgets > 0) {
    throw new AppError(409, 'Referenced global categories cannot be deleted');
  }
  await prisma.category.delete({ where: { id } });
  await audit(context, 'ADMIN_GLOBAL_CATEGORY_DELETED', {
    categoryId: id,
    name: category.name,
    type: category.type,
  });
  return { id };
};

export const auditLogs = async (query: ListAuditLogsQuery) => {
  const where: Prisma.AuditLogWhereInput = {
    ...(query.userId ? { userId: query.userId } : {}),
    ...(query.action
      ? { action: { contains: query.action, mode: 'insensitive' } }
      : {}),
    ...(query.from || query.to
      ? {
          createdAt: {
            ...(query.from ? { gte: query.from } : {}),
            ...(query.to ? { lte: query.to } : {}),
          },
        }
      : {}),
    ...(query.search
      ? {
          OR: [
            { action: { contains: query.search, mode: 'insensitive' } },
            {
              user: {
                is: {
                  OR: [
                    { name: { contains: query.search, mode: 'insensitive' } },
                    { email: { contains: query.search, mode: 'insensitive' } },
                  ],
                },
              },
            },
          ],
        }
      : {}),
  };
  const skip = (query.page - 1) * query.limit;
  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      select: {
        id: true,
        action: true,
        details: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: query.limit,
    }),
    prisma.auditLog.count({ where }),
  ]);
  return {
    items: items.map((item) => ({
      ...item,
      details:
        item.details === null
          ? null
          : redactSettingValue(item.details as Prisma.JsonValue),
    })),
    meta: pageMeta(total, query.page, query.limit),
  };
};

export const emailTemplates = async (query: ListEmailTemplatesQuery) => {
  const where: Prisma.EmailTemplateWhereInput = query.search
    ? {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { subject: { contains: query.search, mode: 'insensitive' } },
        ],
      }
    : {};
  const skip = (query.page - 1) * query.limit;
  const [items, total] = await Promise.all([
    prisma.emailTemplate.findMany({
      where,
      orderBy: { name: 'asc' },
      skip,
      take: query.limit,
    }),
    prisma.emailTemplate.count({ where }),
  ]);
  return { items, meta: pageMeta(total, query.page, query.limit) };
};

export const updateEmailTemplate = async (
  id: string,
  input: { subject?: string; body?: string },
  context: AuditContext,
) => {
  const exists = await prisma.emailTemplate.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!exists) throw new AppError(404, 'Email template not found');
  const template = await prisma.emailTemplate.update({
    where: { id },
    data: input,
  });
  await audit(context, 'ADMIN_EMAIL_TEMPLATE_UPDATED', {
    emailTemplateId: id,
    changedFields: Object.keys(input),
  });
  return template;
};

const sensitiveSettingKey =
  /(password|passwd|credential|secret|token|api[-_]?key|private[-_]?key|(^|[-_])pass($|[-_]))/i;

const redactSettingValue = (value: Prisma.JsonValue, key?: string): unknown => {
  if (key && sensitiveSettingKey.test(key)) return '[REDACTED]';
  if (Array.isArray(value)) {
    return value.map((item) => redactSettingValue(item));
  }
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([childKey, childValue]) => [
        childKey,
        redactSettingValue(childValue as Prisma.JsonValue, childKey),
      ]),
    );
  }
  return value;
};

const serializedSettings = async () => {
  const items = await prisma.globalSetting.findMany({
    orderBy: { key: 'asc' },
  });
  return items.map((item) => ({
    key: item.key,
    value: redactSettingValue(item.value, item.key),
    updatedAt: item.updatedAt,
  }));
};

export const settings = serializedSettings;

const settingValue = (value: unknown) =>
  value === null ? Prisma.JsonNull : (value as Prisma.InputJsonValue);

export const updateSettings = async (
  input: Record<string, unknown>,
  context: AuditContext,
) => {
  await prisma.$transaction(
    Object.entries(input).map(([key, value]) =>
      prisma.globalSetting.upsert({
        where: { key },
        update: { value: settingValue(value) },
        create: { key, value: settingValue(value) },
      }),
    ),
  );
  await audit(context, 'ADMIN_GLOBAL_SETTINGS_UPDATED', {
    keys: Object.keys(input),
  });
  return serializedSettings();
};
