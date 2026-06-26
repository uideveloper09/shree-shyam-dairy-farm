import { prisma } from "@/repositories/prisma";
import type { SubmitRequestInput, ApproveStepInput } from "@/modules/workflows/types";
import { TERMINAL_STATUSES } from "@/modules/workflows/types";
import { findMatchingWorkflow } from "@/modules/workflows/triggers";
import { logWorkflowAudit } from "@/modules/workflows/audit";

async function notifyApprover(userId: string | undefined, title: string, body: string) {
  if (!userId) return;
  try {
    const { dispatchEvent } = await import("@/modules/notifications/rules");
    await dispatchEvent({
      event: "workflow.approval_needed",
      userId,
      payload: { title, body },
    });
  } catch {
    // notification rules optional
  }
}

export async function startWorkflow(input: SubmitRequestInput) {
  const workflow = await findMatchingWorkflow(
    input.type,
    input.payload,
    input.tenantId,
    input.workflowSlug
  );

  if (!workflow || !workflow.steps.length) {
    throw new Error(`No active workflow found for type ${input.type}`);
  }

  const applicableSteps = workflow.steps.filter((step) => {
    const amount = Number(input.payload.amount ?? input.payload.totalAmount ?? 0);
    if (step.minAmount != null && amount < Number(step.minAmount)) return false;
    if (step.maxAmount != null && amount > Number(step.maxAmount)) return false;
    return true;
  });

  const steps = applicableSteps.length ? applicableSteps : workflow.steps;

  const instance = await prisma.workflowInstance.create({
    data: {
      workflowId: workflow.id,
      tenantId: input.tenantId,
      type: input.type,
      status: "IN_REVIEW",
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      requesterId: input.requesterId,
      title: input.title,
      payload: input.payload as object,
      currentStep: 0,
      steps: {
        create: steps.map((s, i) => ({
          stepDefId: s.id,
          order: i,
          name: s.name,
          status: i === 0 && s.autoApprove ? "APPROVED" : i === 0 ? "PENDING" : "PENDING",
          assigneeRole: s.approverRole,
          assigneeId: s.approverUserId,
          dueAt: s.escalateHours ? new Date(Date.now() + s.escalateHours * 3600_000) : undefined,
        })),
      },
    },
    include: { steps: { orderBy: { order: "asc" } } },
  });

  await logWorkflowAudit({
    instanceId: instance.id,
    userId: input.requesterId,
    action: "workflow.started",
    toStatus: instance.status,
    metadata: { workflowSlug: workflow.slug, type: input.type },
  });

  const firstPending = instance.steps.find((s) => s.status === "PENDING");
  if (firstPending) {
    await notifyApprover(
      firstPending.assigneeId ?? undefined,
      "Approval required",
      `${input.title} awaits your approval`
    );
  } else {
    await finalizeInstance(instance.id, "APPROVED", input.requesterId);
  }

  return instance;
}

export async function approveStep(input: ApproveStepInput) {
  const instance = await prisma.workflowInstance.findUnique({
    where: { id: input.instanceId },
    include: { steps: { orderBy: { order: "asc" } } },
  });
  if (!instance) throw new Error("Workflow instance not found");
  if (TERMINAL_STATUSES.includes(instance.status)) {
    throw new Error(`Workflow already ${instance.status}`);
  }

  const step = instance.steps.find((s) => s.id === input.stepId);
  if (!step) throw new Error("Step not found");
  if (step.status !== "PENDING") throw new Error("Step already acted on");

  const canAct =
    step.assigneeId === input.actorId ||
    (step.assigneeRole && step.assigneeRole === input.actorRole) ||
    ["ADMIN", "OWNER"].includes(input.actorRole);

  if (!canAct) throw new Error("Not authorized to act on this step");

  const newStatus = input.approved ? "APPROVED" : "REJECTED";
  await prisma.workflowStepInstance.update({
    where: { id: step.id },
    data: {
      status: newStatus,
      actedById: input.actorId,
      comment: input.comment,
      actedAt: new Date(),
    },
  });

  await logWorkflowAudit({
    instanceId: instance.id,
    userId: input.actorId,
    action: input.approved ? "step.approved" : "step.rejected",
    fromStatus: instance.status,
    stepOrder: step.order,
    comment: input.comment,
    metadata: { stepId: step.id, stepName: step.name },
  });

  if (!input.approved) {
    return finalizeInstance(instance.id, "REJECTED", input.actorId, input.comment);
  }

  const nextStep = instance.steps.find((s) => s.order > step.order && s.status === "PENDING");

  if (nextStep) {
    await prisma.workflowInstance.update({
      where: { id: instance.id },
      data: { currentStep: nextStep.order, status: "IN_REVIEW" },
    });
    await notifyApprover(
      nextStep.assigneeId ?? undefined,
      "Approval required",
      `${instance.title} — step: ${nextStep.name}`
    );
    return prisma.workflowInstance.findUnique({
      where: { id: instance.id },
      include: { steps: { orderBy: { order: "asc" } } },
    });
  }

  return finalizeInstance(instance.id, "APPROVED", input.actorId);
}

async function finalizeInstance(
  instanceId: string,
  status: "APPROVED" | "REJECTED" | "CANCELLED",
  actorId: string,
  comment?: string
) {
  const instance = await prisma.workflowInstance.update({
    where: { id: instanceId },
    data: { status, completedAt: new Date() },
    include: { steps: { orderBy: { order: "asc" } } },
  });

  await logWorkflowAudit({
    instanceId,
    userId: actorId,
    action: `workflow.${status.toLowerCase()}`,
    toStatus: status,
    comment,
  });

  await syncResourceStatus(instance.resourceType, instance.resourceId, status);

  try {
    const { dispatchEvent } = await import("@/modules/notifications/rules");
    await dispatchEvent({
      event: `workflow.${status.toLowerCase()}`,
      userId: instance.requesterId,
      payload: {
        title: instance.title,
        status,
        resourceType: instance.resourceType,
      },
    });
  } catch {
    // optional
  }

  return instance;
}

async function syncResourceStatus(
  resourceType: string,
  resourceId: string,
  status: "APPROVED" | "REJECTED" | "CANCELLED"
) {
  const map = {
    expense: "expenseRequest",
    purchase: "purchaseRequest",
    leave: "leaveRequest",
    refund: "refundRequest",
    subscription: "subscriptionApprovalRequest",
  } as const;

  const model = map[resourceType as keyof typeof map];
  if (!model) return;

  await (prisma[model] as { update: (args: unknown) => Promise<unknown> })
    .update({
      where: { id: resourceId },
      data: { status },
    })
    .catch(() => {});
}

export async function cancelWorkflow(instanceId: string, userId: string) {
  const instance = await prisma.workflowInstance.findUnique({ where: { id: instanceId } });
  if (!instance) throw new Error("Not found");

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  const isAdmin = user && ["ADMIN", "OWNER"].includes(user.role);

  if (instance.requesterId !== userId && !isAdmin) {
    throw new Error("Forbidden");
  }
  return finalizeInstance(instanceId, "CANCELLED", userId);
}

export async function getPendingApprovals(actorId: string, actorRole: string) {
  return prisma.workflowStepInstance.findMany({
    where: {
      status: "PENDING",
      OR: [{ assigneeId: actorId }, { assigneeRole: actorRole }],
      instance: { status: { in: ["PENDING", "IN_REVIEW"] } },
    },
    include: {
      instance: {
        include: {
          requester: { select: { id: true, name: true, email: true } },
          workflow: { select: { name: true, type: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
    take: 50,
  });
}
