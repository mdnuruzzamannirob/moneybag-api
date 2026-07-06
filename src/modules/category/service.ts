import { prisma } from '../../config/db.js';
import { AppError } from '../../utils/response.js';

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
    userId,
    type: query.type,
    ...(query.search
      ? {
          name: {
            contains: query.search,
            mode: 'insensitive' as const,
          },
        }
      : {}),
  };
  const skip = (query.page - 1) * query.limit;
  const [items, total] = await Promise.all([
    prisma.category.findMany({
      where,
      orderBy: { name: 'asc' },
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

export const create = async (
  userId: string,
  data: {
    name: string;
    type: 'INCOME' | 'EXPENSE';
    icon?: string;
    color?: string;
  },
) => prisma.category.create({ data: { ...data, userId } });

export const update = async (
  userId: string,
  id: string,
  data: {
    name?: string;
    type?: 'INCOME' | 'EXPENSE';
    icon?: string;
    color?: string;
  },
) => {
  await ensureOwned(userId, id);
  return prisma.category.update({ where: { id }, data });
};

export const remove = async (userId: string, id: string) => {
  await ensureOwned(userId, id);
  await prisma.category.delete({ where: { id } });
};

const ensureOwned = async (userId: string, id: string) => {
  const category = await prisma.category.findFirst({ where: { id, userId } });
  if (!category) throw new AppError(404, 'Category not found');
  return category;
};
