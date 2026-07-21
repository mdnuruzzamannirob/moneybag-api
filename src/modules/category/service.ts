import { prisma } from '../../config/db.js';
import { AppError } from '../../utils/response.js';

type CategoryInput = {
  name: string;
  type: 'INCOME' | 'EXPENSE';
  icon?: string;
  color?: string;
};

const visibleWhere = (userId: string) => ({
  OR: [{ userId }, { userId: null }],
});

export const list = async (
  userId: string,
  query: {
    search?: string;
    type?: 'INCOME' | 'EXPENSE';
    page: number;
    limit: number;
  },
) => {
  const where = {
    ...visibleWhere(userId),
    type: query.type,
    ...(query.search
      ? { name: { contains: query.search, mode: 'insensitive' as const } }
      : {}),
  };
  const skip = (query.page - 1) * query.limit;
  const [items, total] = await Promise.all([
    prisma.category.findMany({
      where,
      orderBy: [{ userId: 'asc' }, { name: 'asc' }],
      skip,
      take: query.limit,
    }),
    prisma.category.count({ where }),
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

const ensureUnique = async (
  userId: string,
  name: string,
  type: 'INCOME' | 'EXPENSE',
  excludeId?: string,
) => {
  const duplicate = await prisma.category.findFirst({
    where: {
      userId,
      name: { equals: name, mode: 'insensitive' },
      type,
      id: excludeId ? { not: excludeId } : undefined,
    },
  });
  if (duplicate) throw new AppError(409, 'A category with this name and type already exists');
};

export const create = async (userId: string, data: CategoryInput) => {
  await ensureUnique(userId, data.name, data.type);
  return prisma.category.create({ data: { ...data, userId } });
};

const ensureOwned = async (userId: string, id: string) => {
  const category = await prisma.category.findFirst({ where: { id, userId } });
  if (!category) throw new AppError(404, 'Personal category not found');
  return category;
};

export const update = async (
  userId: string,
  id: string,
  data: Partial<CategoryInput>,
) => {
  const current = await ensureOwned(userId, id);
  const type = data.type ?? current.type;
  const name = data.name ?? current.name;
  await ensureUnique(userId, name, type, id);

  if (data.type && data.type !== current.type) {
    const references = await prisma.transaction.count({ where: { categoryId: id } });
    if (references > 0) {
      throw new AppError(409, 'Referenced category type cannot be changed');
    }
  }
  return prisma.category.update({ where: { id }, data });
};

export const remove = async (userId: string, id: string) => {
  await ensureOwned(userId, id);
  const [transactions, budgets] = await Promise.all([
    prisma.transaction.count({ where: { categoryId: id } }),
    prisma.budget.count({ where: { categoryId: id } }),
  ]);
  if (transactions + budgets > 0) {
    throw new AppError(409, 'Category is referenced and cannot be deleted');
  }
  await prisma.category.delete({ where: { id } });
};
