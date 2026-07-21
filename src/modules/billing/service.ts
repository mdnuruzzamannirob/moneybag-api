import type Stripe from 'stripe';
import { prisma } from '../../config/db.js';
import { env } from '../../config/env.js';
import { stripe } from '../../config/stripe.js';
import type { Prisma } from '../../generated/prisma/client.js';
import {
  ensureDefaultPlans,
  getEffectiveSubscription,
} from '../../services/subscription.service.js';
import { AppError } from '../../utils/response.js';

type CheckoutInput = {
  planId?: string;
  planSlug?: 'pro-monthly' | 'pro-yearly' | 'unlimited';
};

type LocalSubscriptionStatus =
  'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'TRIALING' | 'INCOMPLETE' | 'LIFETIME';

type DatabaseClient = Prisma.TransactionClient;

const stripeObjectId = (value: string | { id: string } | null | undefined) =>
  typeof value === 'string' ? value : value?.id;

const unixDate = (value: unknown): Date | null =>
  typeof value === 'number' && Number.isFinite(value)
    ? new Date(value * 1000)
    : null;

const asRecord = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : {};

const stripeErrorCode = (error: unknown) => {
  const record = asRecord(error);
  return typeof record.code === 'string' ? record.code : undefined;
};

const isDuplicateWebhookEvent = (error: unknown) => {
  const record = asRecord(error);
  if (record.code !== 'P2002') return false;
  const meta = asRecord(record.meta);
  const target = meta.target;
  if (typeof target === 'string') return target.includes('stripeEventId');
  return (
    Array.isArray(target) &&
    target.some(
      (field) => typeof field === 'string' && field.includes('stripeEventId'),
    )
  );
};

const serializePlan = <T extends { price: { toString(): string } }>(
  plan: T,
) => ({
  ...plan,
  price: plan.price.toString(),
});

const serializeSubscription = <
  T extends { plan: { price: { toString(): string } } },
>(
  subscription: T,
) => ({
  ...subscription,
  plan: serializePlan(subscription.plan),
});

const requireStripeSecret = () => {
  if (!env.STRIPE_SECRET_KEY) {
    throw new AppError(503, 'Stripe is not configured');
  }
};

const ensureBillingPlans = async () => {
  await ensureDefaultPlans();
  const configuredPrices = [
    ['pro-monthly', env.STRIPE_PRO_MONTHLY_PRICE_ID],
    ['pro-yearly', env.STRIPE_PRO_YEARLY_PRICE_ID],
    ['unlimited', env.STRIPE_UNLIMITED_PRICE_ID],
  ] as const;

  await Promise.all(
    configuredPrices.flatMap(([slug, stripePriceId]) =>
      stripePriceId
        ? [
            prisma.plan.update({
              where: { slug },
              data: { stripePriceId },
            }),
          ]
        : [],
    ),
  );
};

const toLocalStatus = (status: string): LocalSubscriptionStatus => {
  switch (status) {
    case 'active':
      return 'ACTIVE';
    case 'trialing':
      return 'TRIALING';
    case 'past_due':
    case 'unpaid':
    case 'paused':
      return 'PAST_DUE';
    case 'canceled':
      return 'CANCELED';
    case 'incomplete':
    case 'incomplete_expired':
      return 'INCOMPLETE';
    default:
      return 'INCOMPLETE';
  }
};

const subscriptionPeriod = (subscription: Stripe.Subscription) => {
  const subscriptionData = asRecord(subscription);
  const firstItem = subscription.items.data[0];
  const itemData = asRecord(firstItem);
  const start =
    unixDate(subscriptionData.current_period_start) ??
    unixDate(itemData.current_period_start) ??
    unixDate(subscription.start_date) ??
    new Date();
  const end =
    unixDate(subscriptionData.current_period_end) ??
    unixDate(itemData.current_period_end) ??
    unixDate(subscription.cancel_at);

  return { start, end };
};

const findCheckoutPlan = async (input: CheckoutInput) => {
  await ensureBillingPlans();
  const plan = await prisma.plan.findFirst({
    where: {
      isActive: true,
      ...(input.planId ? { id: input.planId } : { slug: input.planSlug }),
    },
  });

  if (!plan) throw new AppError(404, 'Plan not found');
  if (plan.slug === 'free') {
    throw new AppError(400, 'The Free plan does not require checkout');
  }
  if (!plan.stripePriceId) {
    throw new AppError(503, 'Stripe price is not configured for this plan');
  }
  if (!['monthly', 'yearly', 'lifetime'].includes(plan.interval)) {
    throw new AppError(500, 'Plan billing interval is invalid');
  }

  return plan;
};

const getOrCreateStripeCustomer = async (userId: string) => {
  requireStripeSecret();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, stripeCustomerId: true },
  });
  if (!user) throw new AppError(404, 'User not found');

  if (user.stripeCustomerId) {
    try {
      const customer = await stripe.customers.retrieve(user.stripeCustomerId);
      if (!customer.deleted) return customer.id;
    } catch (error) {
      if (stripeErrorCode(error) !== 'resource_missing') throw error;
    }
  }

  const customer = await stripe.customers.create({
    name: user.name,
    email: user.email,
    metadata: { userId: user.id },
  });
  await prisma.user.update({
    where: { id: user.id },
    data: { stripeCustomerId: customer.id },
  });
  return customer.id;
};

export const listPlans = async () => {
  await ensureBillingPlans();
  const plans = await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { price: 'asc' },
  });
  return plans.map(serializePlan);
};

export const getSubscription = async (userId: string) =>
  serializeSubscription(await getEffectiveSubscription(userId));

export const createCheckout = async (userId: string, input: CheckoutInput) => {
  requireStripeSecret();
  const successUrl = env.STRIPE_SUCCESS_URL;
  const cancelUrl = env.STRIPE_CANCEL_URL;
  if (!successUrl || !cancelUrl) {
    throw new AppError(503, 'Stripe checkout URLs are not configured');
  }
  const [plan, currentSubscription] = await Promise.all([
    findCheckoutPlan(input),
    getEffectiveSubscription(userId),
  ]);

  if (
    currentSubscription.status === 'LIFETIME' &&
    currentSubscription.plan.slug === 'unlimited'
  ) {
    throw new AppError(409, 'Lifetime access is already active');
  }
  if (
    plan.interval !== 'lifetime' &&
    currentSubscription.stripeSubscriptionId &&
    ['ACTIVE', 'TRIALING', 'PAST_DUE'].includes(currentSubscription.status)
  ) {
    throw new AppError(
      409,
      'Use the billing portal to change an existing subscription',
    );
  }

  const customerId = await getOrCreateStripeCustomer(userId);
  const priceId = plan.stripePriceId;
  if (!priceId) {
    throw new AppError(503, 'Stripe price is not configured for this plan');
  }
  const metadata = {
    userId,
    planId: plan.id,
    planSlug: plan.slug,
  };
  const mode = plan.interval === 'lifetime' ? 'payment' : 'subscription';
  const params: Stripe.Checkout.SessionCreateParams = {
    mode,
    customer: customerId,
    client_reference_id: userId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
  };

  if (mode === 'subscription') {
    params.subscription_data = { metadata };
  } else {
    params.payment_intent_data = { metadata };
  }

  const session = await stripe.checkout.sessions.create(params);
  if (!session.url) {
    throw new AppError(502, 'Stripe did not return a checkout URL');
  }

  return { sessionId: session.id, url: session.url };
};

export const createPortal = async (userId: string) => {
  requireStripeSecret();
  const returnUrl = env.STRIPE_PORTAL_RETURN_URL;
  if (!returnUrl) {
    throw new AppError(503, 'Stripe portal return URL is not configured');
  }
  const customerId = await getOrCreateStripeCustomer(userId);
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
  return { url: session.url };
};

const resolveSubscriptionOwner = async (
  client: DatabaseClient,
  subscription: Stripe.Subscription,
  hintedUserId?: string,
) => {
  const customerId = stripeObjectId(subscription.customer);
  const userId = hintedUserId || subscription.metadata.userId;
  if (userId) {
    const user = await client.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (user) return { userId: user.id, customerId };
  }
  if (!customerId) return null;

  const user = await client.user.findUnique({
    where: { stripeCustomerId: customerId },
    select: { id: true },
  });
  return user ? { userId: user.id, customerId } : null;
};

const resolveSubscriptionPlan = async (
  client: DatabaseClient,
  subscription: Stripe.Subscription,
  hintedPlanId?: string,
) => {
  // The price is authoritative so portal upgrades and downgrades are reflected
  // even when the subscription's original checkout metadata is unchanged.
  const priceId = subscription.items.data[0]?.price.id;
  if (priceId) {
    const pricePlan = await client.plan.findUnique({
      where: { stripePriceId: priceId },
    });
    if (pricePlan) return pricePlan;
  }

  const planId = hintedPlanId || subscription.metadata.planId;
  if (planId) {
    const plan = await client.plan.findUnique({ where: { id: planId } });
    if (plan) return plan;
  }
  return null;
};

const syncStripeSubscription = async (
  client: DatabaseClient,
  subscription: Stripe.Subscription,
  hints: { userId?: string; planId?: string; forceCanceled?: boolean } = {},
) => {
  const [owner, plan] = await Promise.all([
    resolveSubscriptionOwner(client, subscription, hints.userId),
    resolveSubscriptionPlan(client, subscription, hints.planId),
  ]);
  // A shared Stripe account can send unrelated events; those have no local
  // owner and are intentionally ignored. A known user with an unmapped price,
  // however, must be retried after configuration is fixed.
  if (!owner) return;
  if (!plan) {
    throw new AppError(
      500,
      'Stripe subscription price is not mapped to a plan',
    );
  }

  const existing = await client.subscription.findUnique({
    where: { userId: owner.userId },
  });
  if (
    existing?.status === 'LIFETIME' &&
    existing.stripeSubscriptionId !== subscription.id
  ) {
    return;
  }

  const status: LocalSubscriptionStatus = hints.forceCanceled
    ? 'CANCELED'
    : toLocalStatus(subscription.status);
  const period = subscriptionPeriod(subscription);
  const endedAt =
    unixDate(subscription.ended_at) ??
    unixDate(subscription.canceled_at) ??
    new Date();
  const currentPeriodEnd =
    status === 'CANCELED' && hints.forceCanceled ? endedAt : period.end;

  await client.subscription.upsert({
    where: { userId: owner.userId },
    update: {
      planId: plan.id,
      stripeSubscriptionId: subscription.id,
      status,
      currentPeriodStart: period.start,
      currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
    create: {
      userId: owner.userId,
      planId: plan.id,
      stripeSubscriptionId: subscription.id,
      status,
      currentPeriodStart: period.start,
      currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });

  await client.user.update({
    where: { id: owner.userId },
    data: {
      ...(owner.customerId ? { stripeCustomerId: owner.customerId } : {}),
      trialEndsAt: status === 'TRIALING' ? period.end : null,
    },
  });
};

const cancelExistingRecurringSubscription = async (userId: string) => {
  const existing = await prisma.subscription.findUnique({
    where: { userId },
    select: { stripeSubscriptionId: true },
  });
  if (!existing?.stripeSubscriptionId) return;

  try {
    await stripe.subscriptions.cancel(existing.stripeSubscriptionId);
  } catch (error) {
    if (stripeErrorCode(error) !== 'resource_missing') throw error;
  }
};

const grantLifetimeAccess = async (
  client: DatabaseClient,
  session: Stripe.Checkout.Session,
  userId: string,
  planId: string,
) => {
  const plan = await client.plan.findUnique({ where: { id: planId } });
  if (!plan || plan.slug !== 'unlimited' || plan.interval !== 'lifetime') {
    throw new AppError(400, 'Lifetime checkout plan is invalid');
  }
  const customerId = stripeObjectId(session.customer);
  const now = new Date();

  await client.subscription.upsert({
    where: { userId },
    update: {
      planId: plan.id,
      stripeSubscriptionId: null,
      status: 'LIFETIME',
      currentPeriodStart: now,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    },
    create: {
      userId,
      planId: plan.id,
      status: 'LIFETIME',
      currentPeriodStart: now,
    },
  });
  await client.user.update({
    where: { id: userId },
    data: {
      ...(customerId ? { stripeCustomerId: customerId } : {}),
      trialEndsAt: null,
    },
  });
};

type WebhookAction = (client: DatabaseClient) => Promise<void>;

const noWebhookAction: WebhookAction = async () => undefined;

const checkoutAction = async (
  session: Stripe.Checkout.Session,
): Promise<WebhookAction> => {
  const userId = session.metadata?.userId || session.client_reference_id;
  const planId = session.metadata?.planId;
  if (!userId || !planId) return noWebhookAction;

  if (session.mode === 'payment') {
    if (session.payment_status !== 'paid') return noWebhookAction;
    await cancelExistingRecurringSubscription(userId);
    return (client) => grantLifetimeAccess(client, session, userId, planId);
  }

  const subscriptionId = stripeObjectId(session.subscription);
  if (!subscriptionId) return noWebhookAction;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  return (client) =>
    syncStripeSubscription(client, subscription, { userId, planId });
};

const unknownObjectId = (value: unknown) => {
  if (typeof value === 'string') return value;
  const record = asRecord(value);
  return typeof record.id === 'string' ? record.id : undefined;
};

const invoiceSubscriptionId = (invoice: Stripe.Invoice) => {
  const invoiceData = asRecord(invoice);
  const direct = unknownObjectId(invoiceData.subscription);
  if (direct) return direct;

  const parent = asRecord(invoiceData.parent);
  const subscriptionDetails = asRecord(parent.subscription_details);
  return unknownObjectId(subscriptionDetails.subscription);
};

const invoiceAction = async (
  invoice: Stripe.Invoice,
): Promise<WebhookAction> => {
  const subscriptionId = invoiceSubscriptionId(invoice);
  if (!subscriptionId) return noWebhookAction;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  return (client) => syncStripeSubscription(client, subscription);
};

const prepareWebhookAction = async (
  event: Stripe.Event,
): Promise<WebhookAction> => {
  switch (event.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded':
      return checkoutAction(event.data.object);
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      return (client) => syncStripeSubscription(client, event.data.object);
    case 'customer.subscription.deleted':
      return (client) =>
        syncStripeSubscription(client, event.data.object, {
          forceCanceled: true,
        });
    case 'invoice.paid':
    case 'invoice.payment_succeeded':
    case 'invoice.payment_failed':
      return invoiceAction(event.data.object);
    case 'customer.deleted': {
      const customerId = event.data.object.id;
      return async (client) => {
        const users = await client.user.findMany({
          where: { stripeCustomerId: customerId },
          select: { id: true },
        });
        const userIds = users.map((user) => user.id);
        if (userIds.length > 0) {
          await client.subscription.updateMany({
            where: {
              userId: { in: userIds },
              status: { not: 'LIFETIME' },
            },
            data: {
              status: 'CANCELED',
              currentPeriodEnd: new Date(),
              cancelAtPeriodEnd: false,
            },
          });
        }
        await client.user.updateMany({
          where: { stripeCustomerId: customerId },
          data: { stripeCustomerId: null },
        });
      };
    }
    default:
      return noWebhookAction;
  }
};

export const processWebhookEvent = async (event: Stripe.Event) => {
  const existing = await prisma.stripeWebhookEvent.findUnique({
    where: { stripeEventId: event.id },
    select: { id: true },
  });
  if (existing) return false;

  const action = await prepareWebhookAction(event);
  try {
    await prisma.$transaction(async (client) => {
      await client.stripeWebhookEvent.create({
        data: { stripeEventId: event.id, type: event.type },
      });
      await action(client);
    });
    return true;
  } catch (error) {
    if (isDuplicateWebhookEvent(error)) return false;
    throw error;
  }
};

export const constructWebhookEvent = (payload: Buffer, signature: string) => {
  requireStripeSecret();
  const webhookSecret = env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new AppError(503, 'Stripe webhook is not configured');
  }
  try {
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch {
    throw new AppError(400, 'Invalid Stripe webhook signature');
  }
};
