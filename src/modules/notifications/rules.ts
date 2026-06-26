import { prisma } from "@/repositories/prisma";
import { renderTemplate } from "@/modules/notifications/render";
import { sendMultiChannel } from "@/modules/notifications/dispatcher";
import type { NotificationChannel } from "@prisma/client";
import type { DispatchEventInput } from "@/modules/notifications/types";

function matchesConditions(
  conditions: Record<string, unknown> | null | undefined,
  payload: Record<string, unknown>
): boolean {
  if (!conditions || !Object.keys(conditions).length) return true;
  for (const [key, expected] of Object.entries(conditions)) {
    if (payload[key] !== expected) return false;
  }
  return true;
}

export async function dispatchEvent(input: DispatchEventInput) {
  const rules = await prisma.notificationRule.findMany({
    where: {
      event: input.event,
      isActive: true,
      OR: [{ tenantId: input.tenantId ?? undefined }, { tenantId: null }],
    },
    include: { template: true },
  });

  const results = [];

  for (const rule of rules) {
    const conditions = rule.conditions as Record<string, unknown> | null;
    const payload = input.payload ?? {};
    if (!matchesConditions(conditions, payload)) continue;

    const vars = Object.fromEntries(
      Object.entries(payload).map(([k, v]) => [k, v == null ? "" : String(v)])
    );

    const title = renderTemplate(rule.template.subject || rule.template.name, vars);
    const body = renderTemplate(rule.template.body, vars);
    const channels = (rule.channels as NotificationChannel[]) ?? [rule.template.channel];

    const sendResult = await sendMultiChannel(channels, {
      userId: input.userId,
      tenantId: input.tenantId,
      type: rule.template.type,
      priority: rule.priority,
      title,
      body,
    });

    results.push({ ruleId: rule.id, sendResult });
  }

  return results;
}

export async function evaluateRule(
  ruleId: string,
  payload: Record<string, unknown>,
  userId?: string
) {
  const rule = await prisma.notificationRule.findUnique({
    where: { id: ruleId },
    include: { template: true },
  });
  if (!rule?.isActive) return null;

  const conditions = rule.conditions as Record<string, unknown> | null;
  if (!matchesConditions(conditions, payload)) return null;

  const vars = Object.fromEntries(
    Object.entries(payload).map(([k, v]) => [k, v == null ? "" : String(v)])
  );

  const channels = (rule.channels as NotificationChannel[]) ?? [rule.template.channel];
  return sendMultiChannel(channels, {
    userId,
    tenantId: rule.tenantId,
    type: rule.template.type,
    priority: rule.priority,
    title: renderTemplate(rule.template.subject || rule.template.name, vars),
    body: renderTemplate(rule.template.body, vars),
  });
}
