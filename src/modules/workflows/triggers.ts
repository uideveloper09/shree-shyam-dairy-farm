import { prisma } from "@/repositories/prisma";
import { evaluateConditions } from "@/modules/workflows/conditions";
import type { WorkflowType } from "@prisma/client";
import type { WorkflowPayload } from "@/modules/workflows/types";

export async function findMatchingWorkflow(
  type: WorkflowType,
  payload: WorkflowPayload,
  tenantId?: string | null,
  slug?: string
) {
  if (slug) {
    const bySlug = await prisma.workflowDefinition.findFirst({
      where: {
        slug,
        isActive: true,
        OR: [{ tenantId: tenantId ?? undefined }, { tenantId: null }],
      },
      include: { steps: { orderBy: { order: "asc" } }, conditions: true },
    });
    if (bySlug) return bySlug;
  }

  const workflows = await prisma.workflowDefinition.findMany({
    where: {
      type,
      isActive: true,
      OR: [{ tenantId: tenantId ?? undefined }, { tenantId: null }],
    },
    include: { steps: { orderBy: { order: "asc" } }, conditions: true },
    orderBy: { version: "desc" },
  });

  for (const wf of workflows) {
    if (
      evaluateConditions(
        wf.conditions.map((c) => ({
          field: c.field,
          operator: c.operator,
          value: c.value,
          logicGroup: c.logicGroup,
        })),
        payload
      )
    ) {
      return wf;
    }
  }

  return workflows[0] ?? null;
}

export async function fireWorkflowTrigger(
  event: string,
  payload: WorkflowPayload & { requesterId: string; tenantId?: string | null }
) {
  const triggers = await prisma.workflowTrigger.findMany({
    where: { event, isActive: true },
    include: {
      workflow: {
        include: { steps: { orderBy: { order: "asc" } }, conditions: true },
      },
    },
  });

  const { startWorkflow } = await import("@/modules/workflows/engine");
  const results = [];

  for (const trigger of triggers) {
    if (!trigger.workflow.isActive) continue;
    if (
      !evaluateConditions(
        trigger.workflow.conditions.map((c) => ({
          field: c.field,
          operator: c.operator,
          value: c.value,
          logicGroup: c.logicGroup,
        })),
        payload
      )
    ) {
      continue;
    }

    const instance = await startWorkflow({
      type: trigger.workflow.type,
      requesterId: payload.requesterId,
      tenantId: payload.tenantId,
      title: String(payload.title ?? `${event} approval`),
      payload,
      resourceType: String(payload.resourceType ?? event),
      resourceId: String(payload.resourceId ?? `evt_${Date.now()}`),
      workflowSlug: trigger.workflow.slug,
    });
    results.push(instance);
  }

  return results;
}

export async function runAutomationRules(event: string, payload: WorkflowPayload) {
  const rules = await prisma.workflowAutomationRule.findMany({
    where: { event, isActive: true },
    include: { workflow: true },
  });

  const actions = [];
  for (const rule of rules) {
    const conditions = (rule.conditions as Record<string, unknown>[]) ?? [];
    if (
      conditions.length &&
      !evaluateConditions(
        conditions.map((c) => ({
          field: String(c.field),
          operator: String(c.operator),
          value: c.value,
          logicGroup: String(c.logicGroup ?? "AND"),
        })),
        payload
      )
    ) {
      continue;
    }
    actions.push({ ruleId: rule.id, action: rule.action, workflowId: rule.workflowId });
  }
  return actions;
}
