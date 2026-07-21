import { prisma } from '../config/db.js';
import type { Prisma, TxnType } from '../generated/prisma/client.js';
import { ensureDefaultPlans } from './subscription.service.js';

const SYSTEM_CATEGORIES: ReadonlyArray<{
  name: string;
  type: TxnType;
  icon: string;
  color: string;
}> = [
  { name: 'Salary', type: 'INCOME', icon: 'wallet', color: '#1f9d55' },
  { name: 'Freelance', type: 'INCOME', icon: 'briefcase', color: '#2563eb' },
  { name: 'Investment', type: 'INCOME', icon: 'trending-up', color: '#059669' },
  { name: 'Gift', type: 'INCOME', icon: 'gift', color: '#db2777' },
  { name: 'Food', type: 'EXPENSE', icon: 'utensils', color: '#f97316' },
  { name: 'Transport', type: 'EXPENSE', icon: 'car', color: '#7c3aed' },
  { name: 'Bills', type: 'EXPENSE', icon: 'receipt', color: '#dc2626' },
  { name: 'Entertainment', type: 'EXPENSE', icon: 'tv', color: '#eab308' },
  { name: 'Shopping', type: 'EXPENSE', icon: 'shopping-bag', color: '#0ea5e9' },
  { name: 'Health', type: 'EXPENSE', icon: 'heart-pulse', color: '#ef4444' },
  {
    name: 'Education',
    type: 'EXPENSE',
    icon: 'graduation-cap',
    color: '#8b5cf6',
  },
  { name: 'Subscription', type: 'EXPENSE', icon: 'repeat', color: '#14b8a6' },
  { name: 'Rent', type: 'EXPENSE', icon: 'home', color: '#f59e0b' },
  { name: 'Other', type: 'INCOME', icon: 'plus-circle', color: '#64748b' },
  { name: 'Other', type: 'EXPENSE', icon: 'minus-circle', color: '#64748b' },
];

const EMAIL_TEMPLATES = [
  {
    name: 'welcome',
    subject: 'Welcome to MoneyBag',
    body: '<p>Hi {{name}},</p><p>Welcome to MoneyBag.</p>',
  },
  {
    name: 'password-reset',
    subject: 'Reset your MoneyBag password',
    body: '<p>Hi {{name}},</p><p><a href="{{resetUrl}}">Reset your password</a>. This link expires in one hour.</p>',
  },
  {
    name: 'budget-alert',
    subject: 'Budget alert: {{budgetName}}',
    body: '<p>You have used {{percentUsed}}% of your {{budgetName}} budget.</p>',
  },
  {
    name: 'subscription-expiry',
    subject: 'Your MoneyBag subscription is ending',
    body: '<p>Hi {{name}},</p><p>Your subscription ends on {{endDate}}.</p>',
  },
] as const;

const DEFAULT_SETTINGS: Record<string, Prisma.InputJsonValue> = {
  currencies: ['USD', 'EUR', 'GBP', 'BDT'],
  maintenanceMode: false,
  maxReceiptUploadBytes: 5 * 1024 * 1024,
  maxCsvUploadBytes: 1024 * 1024,
};

export const ensureSystemCategories = async () => {
  for (const category of SYSTEM_CATEGORIES) {
    const existing = await prisma.category.findFirst({
      where: { userId: null, name: category.name, type: category.type },
      select: { id: true },
    });
    if (!existing) await prisma.category.create({ data: category });
  }
};

export const ensureApplicationDefaults = async () => {
  await ensureDefaultPlans();
  await ensureSystemCategories();
  await Promise.all([
    ...EMAIL_TEMPLATES.map((template) =>
      prisma.emailTemplate.upsert({
        where: { name: template.name },
        update: {},
        create: template,
      }),
    ),
    ...Object.entries(DEFAULT_SETTINGS).map(([key, value]) =>
      prisma.globalSetting.upsert({
        where: { key },
        update: {},
        create: { key, value },
      }),
    ),
  ]);
};
