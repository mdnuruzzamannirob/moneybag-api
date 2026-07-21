import { parse } from 'csv-parse/sync';
import crypto from 'node:crypto';
import { z } from 'zod';
import { deleteReceipt, uploadReceipt } from '../../config/cloudinary.js';
import { prisma } from '../../config/db.js';
import { redis } from '../../config/redis.js';
import type {
  Prisma,
  RecurringRule,
  TxnType,
} from '../../generated/prisma/client.js';
import {
  enforceLimit,
  getEntitlements,
  requirePlanFeature,
} from '../../services/subscription.service.js';
import { AppError } from '../../utils/response.js';

export type ListQuery = {
  type?: TxnType;
  category?: string;
  from?: Date;
  to?: Date;
  tag?: string;
  tags?: string;
  search?: string;
  page: number;
  limit: number;
  sortBy: 'date' | 'amount' | 'createdAt';
  sortOrder: 'asc' | 'desc';
};

export type TransactionInput = {
  amount: number;
  type: TxnType;
  categoryId: string;
  note?: string;
  date: Date;
  tags: string[];
  isRecurring?: boolean;
  recurringRule?: RecurringRule | null;
};

export const invalidateUserReports = async (userId: string) => {
  try {
    let cursor = '0';
    do {
      const [next, keys] = await redis.scan(
        cursor,
        'MATCH',
        `reports:${userId}:*`,
        'COUNT',
        100,
      );
      cursor = next;
      if (keys.length > 0) await redis.del(...keys);
    } while (cursor !== '0');
  } catch {
    // A cache outage must not turn an already committed mutation into a 500.
  }
};

const ensureCategory = async (
  userId: string,
  categoryId: string,
  type: TxnType,
  database: Prisma.TransactionClient | typeof prisma = prisma,
) => {
  const category = await database.category.findFirst({
    where: {
      id: categoryId,
      type,
      OR: [{ userId }, { userId: null }],
    },
  });
  if (!category) {
    throw new AppError(400, 'A visible category matching the transaction type is required');
  }
  return category;
};

const ensureOwned = async (userId: string, id: string) => {
  const transaction = await prisma.transaction.findFirst({
    where: { id, userId },
  });
  if (!transaction) throw new AppError(404, 'Transaction not found');
  return transaction;
};

export const list = async (userId: string, query: ListQuery) => {
  const requestedTags = (query.tags ?? query.tag)
    ?.split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
  const where: Prisma.TransactionWhereInput = {
    userId,
    type: query.type,
    categoryId: query.category,
    tags: requestedTags?.length ? { hasEvery: requestedTags } : undefined,
    ...(query.search
      ? {
          OR: [
            { note: { contains: query.search, mode: 'insensitive' } },
            { tags: { has: query.search } },
          ],
        }
      : {}),
    date:
      query.from || query.to
        ? { gte: query.from, lte: query.to }
        : undefined,
  };
  const skip = (query.page - 1) * query.limit;
  const [items, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { category: true },
      orderBy: { [query.sortBy]: query.sortOrder },
      skip,
      take: query.limit,
    }),
    prisma.transaction.count({ where }),
  ]);
  return {
    items,
    meta: {
      total,
      page: query.page,
      limit: query.limit,
      pages: Math.ceil(total / query.limit),
    },
  };
};

const monthRange = (date: Date) => ({
  start: new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)),
  end: new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1)),
});

export const create = async (userId: string, input: TransactionInput) => {
  const { limits } = await getEntitlements(userId);
  const transaction = await prisma.$transaction(
    async (tx) => {
      await ensureCategory(userId, input.categoryId, input.type, tx);
      if (limits.maxTransactions !== null) {
        const { start, end } = monthRange(input.date);
        const count = await tx.transaction.count({
          where: { userId, date: { gte: start, lt: end } },
        });
        enforceLimit(count, limits.maxTransactions, 'monthly transactions');
      }
      return tx.transaction.create({
        data: {
          ...input,
          userId,
          isRecurring: input.isRecurring ?? false,
          recurringRule: input.isRecurring ? input.recurringRule : null,
        },
        include: { category: true },
      });
    },
    { isolationLevel: 'Serializable' },
  );
  await invalidateUserReports(userId);
  return transaction;
};

export const update = async (
  userId: string,
  id: string,
  input: Partial<TransactionInput>,
) => {
  const current = await ensureOwned(userId, id);
  const type = input.type ?? current.type;
  const categoryId = input.categoryId ?? current.categoryId;
  await ensureCategory(userId, categoryId, type);
  const data: Prisma.TransactionUncheckedUpdateInput = {
    amount: input.amount,
    type: input.type,
    categoryId: input.categoryId,
    note: input.note,
    date: input.date,
    tags: input.tags,
    isRecurring: input.isRecurring,
    recurringRule:
      input.isRecurring === false
        ? null
        : input.recurringRule,
  };
  const transaction = await prisma.transaction.update({
    where: { id },
    data,
    include: { category: true },
  });
  await invalidateUserReports(userId);
  return transaction;
};

export const remove = async (userId: string, id: string) => {
  const transaction = await ensureOwned(userId, id);
  if (transaction.receiptPublicId) await deleteReceipt(transaction.receiptPublicId);
  await prisma.transaction.delete({ where: { id } });
  await invalidateUserReports(userId);
};

const csvRowSchema = z.object({
  amount: z.coerce.number().finite().positive(),
  type: z.enum(['INCOME', 'EXPENSE']),
  categoryId: z.string().uuid(),
  date: z.coerce.date(),
  note: z.string().max(500).optional().transform((value) => value || undefined),
  tags: z.string().optional().transform((value) =>
    value ? value.split('|').map((tag) => tag.trim()).filter(Boolean) : [],
  ),
  isRecurring: z
    .enum(['true', 'false', ''])
    .optional()
    .transform((value) => value === 'true'),
  recurringRule: z
    .enum(['DAILY', 'WEEKLY', 'MONTHLY', ''])
    .optional()
    .transform((value) => value || undefined),
});

export const importCsv = async (userId: string, csv: string) => {
  await requirePlanFeature(userId, 'csvImport');
  let rawRows: Array<Record<string, string>>;
  try {
    rawRows = parse(csv, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
    }) as Array<Record<string, string>>;
  } catch (error) {
    throw new AppError(400, 'CSV could not be parsed', 'INVALID_CSV', error);
  }
  if (rawRows.length === 0) throw new AppError(400, 'CSV file contains no rows');
  if (rawRows.length > 1000) throw new AppError(400, 'CSV import is limited to 1000 rows');

  const rows = rawRows.map((row, index) => {
    const parsed = csvRowSchema.safeParse(row);
    if (!parsed.success) {
      throw new AppError(400, `CSV row ${index + 2} is invalid`, 'INVALID_CSV_ROW', parsed.error.issues);
    }
    if (parsed.data.isRecurring && !parsed.data.recurringRule) {
      throw new AppError(400, `CSV row ${index + 2} requires recurringRule`);
    }
    return parsed.data;
  });

  const { limits } = await getEntitlements(userId);
  const ids = rows.map(() => crypto.randomUUID());
  await prisma.$transaction(
    async (tx) => {
      const categories = new Map<string, TxnType>();
      for (const row of rows) {
        const key = `${row.categoryId}:${row.type}`;
        if (!categories.has(key)) {
          await ensureCategory(userId, row.categoryId, row.type, tx);
          categories.set(key, row.type);
        }
      }

      if (limits.maxTransactions !== null) {
        const grouped = new Map<string, { date: Date; count: number }>();
        for (const row of rows) {
          const key = `${row.date.getUTCFullYear()}-${row.date.getUTCMonth()}`;
          const group = grouped.get(key) ?? { date: row.date, count: 0 };
          group.count += 1;
          grouped.set(key, group);
        }
        for (const group of grouped.values()) {
          const { start, end } = monthRange(group.date);
          const existing = await tx.transaction.count({
            where: { userId, date: { gte: start, lt: end } },
          });
          if (existing + group.count > limits.maxTransactions) {
            throw new AppError(403, 'CSV import would exceed the monthly transaction limit');
          }
        }
      }

      await tx.transaction.createMany({
        data: rows.map((row, index) => ({
          id: ids[index]!,
          userId,
          amount: row.amount,
          type: row.type,
          categoryId: row.categoryId,
          note: row.note,
          date: row.date,
          tags: row.tags,
          isRecurring: row.isRecurring,
          recurringRule: row.isRecurring ? row.recurringRule : null,
        })),
      });
    },
    { isolationLevel: 'Serializable' },
  );
  await invalidateUserReports(userId);
  return prisma.transaction.findMany({
    where: { id: { in: ids } },
    include: { category: true },
    orderBy: { date: 'asc' },
  });
};

const validImageSignature = (buffer: Buffer, mime: string) => {
  if (mime === 'image/jpeg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (mime === 'image/png') {
    return buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  }
  if (mime === 'image/webp') {
    return buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP';
  }
  return false;
};

export const attachReceipt = async (
  userId: string,
  id: string,
  file: { buffer: Buffer; mimetype: string },
) => {
  await requirePlanFeature(userId, 'receiptUpload');
  await ensureOwned(userId, id);
  if (!validImageSignature(file.buffer, file.mimetype)) {
    throw new AppError(415, 'Receipt must be a valid JPEG, PNG, or WebP image');
  }
  const uploaded = await uploadReceipt(file.buffer, userId, id);
  try {
    return await prisma.transaction.update({
      where: { id },
      data: { receiptUrl: uploaded.url, receiptPublicId: uploaded.publicId },
      include: { category: true },
    });
  } catch (error) {
    await deleteReceipt(uploaded.publicId).catch(() => undefined);
    throw error;
  }
};
