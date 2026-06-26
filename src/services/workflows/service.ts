import { prisma } from "@/repositories/prisma";
import { startWorkflow } from "@/modules/workflows/engine";
import type { WorkflowType } from "@prisma/client";
import { buildVisualFromSteps } from "@/modules/workflows/visual";

export async function submitExpenseRequest(
  requesterId: string,
  data: {
    category: string;
    amount: number;
    description?: string;
    receiptUrl?: string;
    tenantId?: string | null;
  }
) {
  const request = await prisma.expenseRequest.create({
    data: {
      requesterId,
      tenantId: data.tenantId,
      category: data.category,
      amount: data.amount,
      description: data.description,
      receiptUrl: data.receiptUrl,
    },
  });

  const instance = await startWorkflow({
    type: "EXPENSE",
    requesterId,
    tenantId: data.tenantId,
    title: `Expense: ${data.category} — ₹${data.amount}`,
    payload: { amount: data.amount, category: data.category, description: data.description },
    resourceType: "expense",
    resourceId: request.id,
  });

  await prisma.expenseRequest.update({
    where: { id: request.id },
    data: { instanceId: instance.id },
  });

  return { request, instance };
}

export async function submitPurchaseRequest(
  requesterId: string,
  data: {
    vendor?: string;
    items: unknown[];
    totalAmount: number;
    notes?: string;
    tenantId?: string | null;
  }
) {
  const request = await prisma.purchaseRequest.create({
    data: {
      requesterId,
      tenantId: data.tenantId,
      vendor: data.vendor,
      items: data.items as object,
      totalAmount: data.totalAmount,
      notes: data.notes,
    },
  });

  const instance = await startWorkflow({
    type: "PURCHASE",
    requesterId,
    tenantId: data.tenantId,
    title: `Purchase: ₹${data.totalAmount}${data.vendor ? ` — ${data.vendor}` : ""}`,
    payload: { totalAmount: data.totalAmount, vendor: data.vendor, items: data.items },
    resourceType: "purchase",
    resourceId: request.id,
  });

  await prisma.purchaseRequest.update({
    where: { id: request.id },
    data: { instanceId: instance.id },
  });

  return { request, instance };
}

export async function submitLeaveRequest(
  requesterId: string,
  data: {
    leaveType: "SICK" | "CASUAL" | "EARNED" | "UNPAID" | "OTHER";
    startDate: string;
    endDate: string;
    reason?: string;
    tenantId?: string | null;
  }
) {
  const request = await prisma.leaveRequest.create({
    data: {
      requesterId,
      tenantId: data.tenantId,
      leaveType: data.leaveType,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      reason: data.reason,
    },
  });

  const instance = await startWorkflow({
    type: "LEAVE",
    requesterId,
    tenantId: data.tenantId,
    title: `Leave: ${data.leaveType} (${data.startDate} → ${data.endDate})`,
    payload: {
      leaveType: data.leaveType,
      startDate: data.startDate,
      endDate: data.endDate,
      reason: data.reason,
    },
    resourceType: "leave",
    resourceId: request.id,
  });

  await prisma.leaveRequest.update({
    where: { id: request.id },
    data: { instanceId: instance.id },
  });

  return { request, instance };
}

export async function submitRefundRequest(
  requesterId: string,
  data: {
    orderId?: string;
    orderNumber?: string;
    amount: number;
    reason: string;
  }
) {
  const request = await prisma.refundRequest.create({
    data: {
      requesterId,
      orderId: data.orderId,
      orderNumber: data.orderNumber,
      amount: data.amount,
      reason: data.reason,
    },
  });

  const instance = await startWorkflow({
    type: "REFUND",
    requesterId,
    title: `Refund: ${data.orderNumber || data.orderId || "order"} — ₹${data.amount}`,
    payload: { amount: data.amount, orderNumber: data.orderNumber, reason: data.reason },
    resourceType: "refund",
    resourceId: request.id,
  });

  await prisma.refundRequest.update({
    where: { id: request.id },
    data: { instanceId: instance.id },
  });

  return { request, instance };
}

export async function submitSubscriptionApproval(
  requesterId: string,
  data: {
    subscriptionId?: string;
    action: string;
    reason?: string;
  }
) {
  const request = await prisma.subscriptionApprovalRequest.create({
    data: {
      requesterId,
      subscriptionId: data.subscriptionId,
      action: data.action,
      reason: data.reason,
    },
  });

  const instance = await startWorkflow({
    type: "SUBSCRIPTION",
    requesterId,
    title: `Subscription ${data.action}`,
    payload: { action: data.action, subscriptionId: data.subscriptionId, reason: data.reason },
    resourceType: "subscription",
    resourceId: request.id,
  });

  await prisma.subscriptionApprovalRequest.update({
    where: { id: request.id },
    data: { instanceId: instance.id },
  });

  return { request, instance };
}

export async function createWorkflowDefinition(data: {
  slug: string;
  name: string;
  type: WorkflowType;
  description?: string;
  tenantId?: string | null;
  createdById?: string;
  steps: {
    order: number;
    name: string;
    approverRole?: string;
    approverUserId?: string;
    minAmount?: number;
    maxAmount?: number;
    autoApprove?: boolean;
    escalateHours?: number;
  }[];
  conditions?: { field: string; operator: string; value: unknown; logicGroup?: string }[];
  triggers?: { type: string; event?: string; schedule?: string }[];
  visual?: object;
}) {
  const visual = data.visual ?? buildVisualFromSteps(data.steps);

  return prisma.workflowDefinition.create({
    data: {
      slug: data.slug,
      name: data.name,
      type: data.type,
      description: data.description,
      tenantId: data.tenantId,
      createdById: data.createdById,
      visual: visual as object,
      steps: { create: data.steps },
      conditions: data.conditions?.length
        ? {
            create: data.conditions.map((c) => ({
              field: c.field,
              operator: c.operator,
              value: c.value as object,
              logicGroup: c.logicGroup,
            })),
          }
        : undefined,
      triggers: data.triggers?.length
        ? {
            create: data.triggers.map((t) => ({
              type: t.type as "MANUAL" | "EVENT" | "SCHEDULE" | "CONDITION",
              event: t.event,
              schedule: t.schedule,
            })),
          }
        : undefined,
    },
    include: { steps: true, conditions: true, triggers: true },
  });
}

export async function listWorkflowDefinitions(tenantId?: string | null) {
  return prisma.workflowDefinition.findMany({
    where: { OR: [{ tenantId: tenantId ?? undefined }, { tenantId: null }] },
    include: { steps: { orderBy: { order: "asc" } }, _count: { select: { instances: true } } },
    orderBy: { type: "asc" },
  });
}

export async function getWorkflowInstance(id: string) {
  return prisma.workflowInstance.findUnique({
    where: { id },
    include: {
      steps: {
        orderBy: { order: "asc" },
        include: { actedBy: { select: { name: true, email: true } } },
      },
      requester: { select: { id: true, name: true, email: true } },
      workflow: { select: { name: true, slug: true, type: true, visual: true } },
      auditLogs: { orderBy: { createdAt: "asc" }, take: 100 },
    },
  });
}

export async function listUserRequests(userId: string) {
  return prisma.workflowInstance.findMany({
    where: { requesterId: userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      workflow: { select: { name: true, type: true } },
      steps: { orderBy: { order: "asc" } },
    },
  });
}

export async function getWorkflowDashboardStats() {
  const [pending, approved, rejected, inReview] = await Promise.all([
    prisma.workflowInstance.count({ where: { status: "PENDING" } }),
    prisma.workflowInstance.count({ where: { status: "APPROVED" } }),
    prisma.workflowInstance.count({ where: { status: "REJECTED" } }),
    prisma.workflowInstance.count({ where: { status: "IN_REVIEW" } }),
  ]);

  const byType = await prisma.workflowInstance.groupBy({
    by: ["type"],
    _count: true,
    where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 3600_000) } },
  });

  return { pending, approved, rejected, inReview, byType };
}
