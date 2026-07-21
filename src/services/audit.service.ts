import { prisma } from '../config/db.js';
import type { Prisma } from '../generated/prisma/client.js';

type AuditInput = {
  userId?: string;
  action: string;
  details?: Prisma.InputJsonValue;
  ipAddress?: string;
  userAgent?: string;
};

export const recordAudit = async (input: AuditInput) => {
  await prisma.auditLog.create({
    data: {
      userId: input.userId,
      action: input.action,
      details: input.details,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    },
  });
};
