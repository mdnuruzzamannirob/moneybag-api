import bcrypt from 'bcrypt';
import { prisma } from '../../config/db.js';
import { AppError } from '../../utils/response.js';

export const getProfile = async (userId: string) =>
  prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      currency: true,
      isActive: true,
      createdAt: true,
    },
  });

export const updateProfile = async (
  userId: string,
  data: { name?: string; currency?: string },
) =>
  prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      currency: true,
      isActive: true,
    },
  });

export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string,
) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const matched = await bcrypt.compare(currentPassword, user.password);
  if (!matched) throw new AppError(401, 'Current password is incorrect');

  await prisma.user.update({
    where: { id: userId },
    data: { password: await bcrypt.hash(newPassword, 12) },
  });
};
