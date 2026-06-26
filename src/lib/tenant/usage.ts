import { prisma } from "@/repositories/prisma";
import { TENANT_PLANS, type TenantPlan } from "@/constants/tenant";

export async function recordUsage(
  tenantId: string,
  metric: string,
  quantity = 1,
  metadata?: Record<string, unknown>
) {
  const periodStart = new Date();
  periodStart.setMinutes(0, 0, 0);

  return prisma.usageRecord.create({
    data: {
      tenantId,
      metric,
      quantity,
      periodStart,
      metadata: metadata as object,
    },
  });
}

export async function getUsageSummary(tenantId: string, since: Date) {
  const records = await prisma.usageRecord.groupBy({
    by: ["metric"],
    where: { tenantId, periodStart: { gte: since } },
    _sum: { quantity: true },
  });

  return Object.fromEntries(records.map((r) => [r.metric, r._sum.quantity ?? 0]));
}

export async function checkUsageLimit(tenantId: string, metric: string): Promise<boolean> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { plan: true },
  });
  if (!tenant) return false;

  const plan = TENANT_PLANS[tenant.plan as TenantPlan] ?? TENANT_PLANS.starter;
  const limit = plan.limits[metric];
  if (limit === undefined || limit < 0) return true;

  const since = new Date();
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const used = await prisma.usageRecord.aggregate({
    where: { tenantId, metric, periodStart: { gte: since } },
    _sum: { quantity: true },
  });

  return (used._sum.quantity ?? 0) < limit;
}

export async function snapshotDailyAnalytics(tenantId: string, date = new Date()) {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { slug: true },
  });
  if (!tenant) return null;

  const nextDay = new Date(day);
  nextDay.setDate(nextDay.getDate() + 1);

  const [orders, revenue, apiCalls, activeUsers] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: day, lt: nextDay } } }),
    prisma.order.aggregate({
      where: { createdAt: { gte: day, lt: nextDay }, paymentStatus: "CAPTURED" },
      _sum: { total: true },
    }),
    prisma.usageRecord.aggregate({
      where: { tenantId, metric: "api_calls", periodStart: { gte: day, lt: nextDay } },
      _sum: { quantity: true },
    }),
    prisma.user.count({ where: { lastLoginAt: { gte: day } } }),
  ]);

  return prisma.tenantDailyAnalytics.upsert({
    where: { tenantId_date: { tenantId, date: day } },
    create: {
      tenantId,
      date: day,
      orders,
      revenue: revenue._sum.total ?? 0,
      apiCalls: apiCalls._sum.quantity ?? 0,
      activeUsers,
    },
    update: {
      orders,
      revenue: revenue._sum.total ?? 0,
      apiCalls: apiCalls._sum.quantity ?? 0,
      activeUsers,
    },
  });
}
