import { randomBytes } from 'node:crypto';
import { prisma } from '../../config/db.js';
import type { Prisma } from '../../generated/prisma/client.js';
import {
  requirePlanFeature,
  type PlanLimits,
} from '../../services/subscription.service.js';
import { AppError } from '../../utils/response.js';
import { sendMail } from '../../utils/mailer.js';

type FamilyRole = 'VIEWER' | 'EDITOR';

type ListGroupsQuery = {
  search?: string;
  page: number;
  limit: number;
};

type TransactionQuery = {
  type?: 'INCOME' | 'EXPENSE';
  category?: string;
  from?: string;
  to?: string;
  tag?: string;
  search?: string;
  page: number;
  limit: number;
  sortBy: 'date' | 'amount' | 'createdAt';
  sortOrder: 'asc' | 'desc';
};

const memberUserSelect = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
} as const;

const groupInclude = {
  owner: { select: memberUserSelect },
  members: {
    include: { user: { select: memberUserSelect } },
    orderBy: { createdAt: 'asc' as const },
  },
  _count: { select: { members: true } },
} as const;

const ensureOwnedGroup = async (userId: string, groupId: string) => {
  const group = await prisma.familyGroup.findFirst({
    where: { id: groupId, ownerId: userId },
    include: groupInclude,
  });
  if (!group) throw new AppError(404, 'Family group not found');
  return group;
};

const ensureAccessibleGroup = async (userId: string, groupId: string) => {
  const group = await prisma.familyGroup.findFirst({
    where: {
      id: groupId,
      OR: [{ ownerId: userId }, { members: { some: { userId } } }],
    },
    include: groupInclude,
  });
  if (!group) throw new AppError(404, 'Family group not found');
  return group;
};

const assertCapacity = (
  memberCount: number,
  pendingInvitationCount: number,
  limits: PlanLimits,
) => {
  if (
    limits.maxFamilyMembers <= 0 ||
    memberCount + pendingInvitationCount >= limits.maxFamilyMembers
  ) {
    throw new AppError(403, 'This family group has reached its member limit');
  }
};

export const listGroups = async (
  userId: string,
  query: ListGroupsQuery,
) => {
  const where: Prisma.FamilyGroupWhereInput = {
    OR: [{ ownerId: userId }, { members: { some: { userId } } }],
    ...(query.search
      ? {
          name: {
            contains: query.search,
            mode: 'insensitive',
          },
        }
      : {}),
  };
  const skip = (query.page - 1) * query.limit;
  const [groups, total] = await Promise.all([
    prisma.familyGroup.findMany({
      where,
      include: groupInclude,
      orderBy: { updatedAt: 'desc' },
      skip,
      take: query.limit,
    }),
    prisma.familyGroup.count({ where }),
  ]);

  return {
    items: groups.map((group) => ({
      ...group,
      currentUserRole:
        group.ownerId === userId
          ? ('OWNER' as const)
          : (group.members.find((member) => member.userId === userId)?.role ??
            null),
    })),
    meta: {
      total,
      page: query.page,
      limit: query.limit,
      pages: Math.ceil(total / query.limit),
    },
  };
};

export const createGroup = async (userId: string, name: string) => {
  await requirePlanFeature(userId, 'familySharing');
  return prisma.familyGroup.create({
    data: { ownerId: userId, name },
    include: groupInclude,
  });
};

export const inviteMember = async (
  userId: string,
  groupId: string,
  input: { email: string; role: FamilyRole },
) => {
  const group = await ensureOwnedGroup(userId, groupId);
  const { limits } = await requirePlanFeature(userId, 'familySharing');
  const email = input.email.toLowerCase();
  const now = new Date();

  if (group.owner.email.toLowerCase() === email) {
    throw new AppError(400, 'The group owner is already part of this group');
  }

  await prisma.familyInvitation.updateMany({
    where: { groupId, status: 'PENDING', expiresAt: { lte: now } },
    data: { status: 'EXPIRED' },
  });

  const invitedUser = await prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
    select: memberUserSelect,
  });
  if (
    invitedUser &&
    group.members.some((member) => member.userId === invitedUser.id)
  ) {
    throw new AppError(409, 'This user is already a member of the group');
  }

  const duplicateInvitation = await prisma.familyInvitation.findFirst({
    where: {
      groupId,
      email: { equals: email, mode: 'insensitive' },
      status: 'PENDING',
      expiresAt: { gt: now },
    },
  });
  if (duplicateInvitation) {
    throw new AppError(409, 'An active invitation already exists for this email');
  }

  const pendingInvitationCount = await prisma.familyInvitation.count({
    where: { groupId, status: 'PENDING', expiresAt: { gt: now } },
  });
  assertCapacity(group.members.length, pendingInvitationCount, limits);

  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const invitation = await prisma.familyInvitation.create({
    data: {
      groupId,
      email,
      invitedUserId: invitedUser?.id,
      role: input.role,
      token,
      expiresAt,
    },
    include: {
      group: { select: { id: true, name: true } },
      invitedUser: { select: memberUserSelect },
    },
  });

  try {
    await sendMail(
      email,
      `Invitation to join ${group.name}`,
      `You have been invited to join ${group.name}. Your invitation token is ${token}. This invitation expires in 7 days.`,
    );
  } catch (error) {
    console.error('Failed to send family invitation email', error);
  }

  return invitation;
};

export const acceptInvitation = async (
  user: { id: string; email: string },
  token: string,
) => {
  const invitation = await prisma.familyInvitation.findUnique({
    where: { token },
    include: { group: { select: { id: true, ownerId: true, name: true } } },
  });
  if (!invitation) throw new AppError(404, 'Family invitation not found');

  if (
    invitation.invitedUserId !== null &&
    invitation.invitedUserId !== user.id
  ) {
    throw new AppError(403, 'This invitation belongs to another user');
  }
  if (invitation.email.toLowerCase() !== user.email.toLowerCase()) {
    throw new AppError(403, 'This invitation belongs to another email address');
  }
  if (invitation.status === 'ACCEPTED') {
    const membership = await prisma.familyMember.findUnique({
      where: {
        groupId_userId: { groupId: invitation.groupId, userId: user.id },
      },
      include: { group: true },
    });
    if (membership) return { invitation, membership };
    throw new AppError(409, 'This invitation has already been accepted');
  }
  if (invitation.status !== 'PENDING') {
    throw new AppError(409, `This invitation is ${invitation.status.toLowerCase()}`);
  }
  if (invitation.expiresAt.getTime() <= Date.now()) {
    await prisma.familyInvitation.update({
      where: { id: invitation.id },
      data: { status: 'EXPIRED' },
    });
    throw new AppError(410, 'This invitation has expired');
  }
  if (invitation.group.ownerId === user.id) {
    throw new AppError(400, 'The group owner cannot accept a member invitation');
  }

  const { limits } = await requirePlanFeature(
    invitation.group.ownerId,
    'familySharing',
  );

  return prisma.$transaction(
    async (transaction) => {
      const currentInvitation = await transaction.familyInvitation.findUnique({
        where: { id: invitation.id },
      });
      if (!currentInvitation || currentInvitation.status !== 'PENDING') {
        throw new AppError(409, 'This invitation is no longer available');
      }
      if (currentInvitation.expiresAt.getTime() <= Date.now()) {
        throw new AppError(410, 'This invitation has expired');
      }

      const existingMembership = await transaction.familyMember.findUnique({
        where: {
          groupId_userId: { groupId: invitation.groupId, userId: user.id },
        },
      });
      if (!existingMembership) {
        const memberCount = await transaction.familyMember.count({
          where: { groupId: invitation.groupId },
        });
        assertCapacity(memberCount, 0, limits);
      }

      const membership =
        existingMembership ??
        (await transaction.familyMember.create({
          data: {
            groupId: invitation.groupId,
            userId: user.id,
            role: invitation.role,
          },
        }));
      const acceptedInvitation = await transaction.familyInvitation.update({
        where: { id: invitation.id },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date(),
          invitedUserId: user.id,
        },
      });
      await transaction.familyInvitation.updateMany({
        where: {
          id: { not: invitation.id },
          groupId: invitation.groupId,
          email: { equals: user.email, mode: 'insensitive' },
          status: 'PENDING',
        },
        data: { status: 'REVOKED' },
      });

      return { invitation: acceptedInvitation, membership };
    },
    { isolationLevel: 'Serializable' },
  );
};

export const removeMember = async (
  userId: string,
  groupId: string,
  memberUserId: string,
) => {
  await ensureOwnedGroup(userId, groupId);
  const member = await prisma.familyMember.findUnique({
    where: { groupId_userId: { groupId, userId: memberUserId } },
  });
  if (!member) throw new AppError(404, 'Family member not found');

  await prisma.familyMember.delete({
    where: { groupId_userId: { groupId, userId: memberUserId } },
  });
};

export const listGroupTransactions = async (
  userId: string,
  groupId: string,
  query: TransactionQuery,
) => {
  const group = await ensureAccessibleGroup(userId, groupId);
  await requirePlanFeature(group.ownerId, 'familySharing');
  const participantIds = [
    group.ownerId,
    ...group.members.map((member) => member.userId),
  ];
  const where: Prisma.TransactionWhereInput = {
    userId: { in: participantIds },
    ...(query.type ? { type: query.type } : {}),
    ...(query.category ? { categoryId: query.category } : {}),
    ...(query.tag ? { tags: { has: query.tag } } : {}),
    ...(query.search
      ? {
          OR: [
            { note: { contains: query.search, mode: 'insensitive' } },
            { tags: { has: query.search } },
          ],
        }
      : {}),
    ...(query.from || query.to
      ? {
          date: {
            ...(query.from ? { gte: new Date(query.from) } : {}),
            ...(query.to ? { lte: new Date(query.to) } : {}),
          },
        }
      : {}),
  };
  const orderBy: Prisma.TransactionOrderByWithRelationInput =
    query.sortBy === 'amount'
      ? { amount: query.sortOrder }
      : query.sortBy === 'createdAt'
        ? { createdAt: query.sortOrder }
        : { date: query.sortOrder };
  const skip = (query.page - 1) * query.limit;
  const [items, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        category: true,
        user: { select: memberUserSelect },
      },
      orderBy,
      skip,
      take: query.limit,
    }),
    prisma.transaction.count({ where }),
  ]);

  return {
    group: {
      id: group.id,
      name: group.name,
      owner: group.owner,
      memberCount: group.members.length,
    },
    items,
    meta: {
      total,
      page: query.page,
      limit: query.limit,
      pages: Math.ceil(total / query.limit),
    },
  };
};
