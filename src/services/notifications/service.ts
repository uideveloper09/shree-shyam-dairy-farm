import { prisma } from "@/repositories/prisma";
import type { NotificationChannel, NotificationType } from "@prisma/client";
import { renderTemplate } from "@/modules/notifications/render";

export async function listTemplates(tenantId?: string | null) {
  return prisma.notificationTemplate.findMany({
    where: {
      isActive: true,
      OR: [{ tenantId: tenantId ?? undefined }, { tenantId: null }],
    },
    orderBy: { slug: "asc" },
  });
}

export async function getTemplate(id: string) {
  return prisma.notificationTemplate.findUnique({ where: { id } });
}

export async function createTemplate(data: {
  tenantId?: string | null;
  slug: string;
  name: string;
  channel: NotificationChannel;
  type?: NotificationType;
  subject?: string;
  body: string;
  variables?: string[];
}) {
  return prisma.notificationTemplate.create({
    data: {
      tenantId: data.tenantId,
      slug: data.slug,
      name: data.name,
      channel: data.channel,
      type: data.type ?? "TRANSACTIONAL",
      subject: data.subject,
      body: data.body,
      variables: data.variables,
    },
  });
}

export async function updateTemplate(
  id: string,
  data: Partial<{
    name: string;
    subject: string;
    body: string;
    isActive: boolean;
    variables: string[];
  }>
) {
  return prisma.notificationTemplate.update({ where: { id }, data });
}

export async function renderFromTemplate(templateId: string, variables: Record<string, string>) {
  const template = await getTemplate(templateId);
  if (!template) throw new Error("Template not found");
  return {
    title: renderTemplate(template.subject || template.name, variables),
    body: renderTemplate(template.body, variables),
    channel: template.channel,
    type: template.type,
  };
}

export async function listUserNotifications(userId: string, unreadOnly = false) {
  return prisma.notification.findMany({
    where: {
      userId,
      channel: "IN_APP",
      ...(unreadOnly ? { readAt: null } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function markNotificationRead(userId: string, notificationId: string) {
  const { recordNotificationOpened } = await import("@/modules/notifications/analytics");
  return recordNotificationOpened(userId, notificationId);
}

export async function getUnreadCount(userId: string) {
  return prisma.notification.count({
    where: { userId, channel: "IN_APP", readAt: null },
  });
}

export async function listRules(tenantId?: string | null) {
  return prisma.notificationRule.findMany({
    where: { OR: [{ tenantId: tenantId ?? undefined }, { tenantId: null }] },
    include: { template: { select: { slug: true, name: true, channel: true } } },
    orderBy: { event: "asc" },
  });
}

export async function createRule(data: {
  tenantId?: string | null;
  name: string;
  event: string;
  templateId: string;
  channels: NotificationChannel[];
  conditions?: Record<string, unknown>;
  priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
}) {
  return prisma.notificationRule.create({
    data: {
      tenantId: data.tenantId,
      name: data.name,
      event: data.event,
      templateId: data.templateId,
      channels: data.channels as unknown as object,
      conditions: data.conditions as object,
      priority: data.priority ?? "NORMAL",
    },
  });
}

export async function listBroadcasts(tenantId?: string | null) {
  return prisma.notificationBroadcast.findMany({
    where: { tenantId: tenantId ?? undefined },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function getNotificationHistory(userId: string) {
  return prisma.notificationDelivery.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      channel: true,
      title: true,
      status: true,
      sentAt: true,
      deliveredAt: true,
      createdAt: true,
    },
  });
}
