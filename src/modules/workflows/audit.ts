import { prisma } from "@/repositories/prisma";

export async function logWorkflowAudit(input: {
  instanceId: string;
  userId?: string;
  action: string;
  fromStatus?: string;
  toStatus?: string;
  stepOrder?: number;
  comment?: string;
  metadata?: Record<string, unknown>;
}) {
  return prisma.workflowAuditLog.create({
    data: {
      instanceId: input.instanceId,
      userId: input.userId,
      action: input.action,
      fromStatus: input.fromStatus,
      toStatus: input.toStatus,
      stepOrder: input.stepOrder,
      comment: input.comment,
      metadata: input.metadata as object,
    },
  });
}

export async function getWorkflowAuditTrail(instanceId: string) {
  return prisma.workflowAuditLog.findMany({
    where: { instanceId },
    orderBy: { createdAt: "asc" },
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
    },
  });
}

export async function getRecentAuditLogs(limit = 50) {
  return prisma.workflowAuditLog.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      instance: { select: { id: true, title: true, type: true, status: true } },
      user: { select: { id: true, name: true, email: true } },
    },
  });
}
