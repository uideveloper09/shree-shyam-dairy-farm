import { prisma } from "@/repositories/prisma";
import type { ModuleInsight } from "@/modules/ai-platform/types";

const dayStart = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export async function analyzeFinance(): Promise<ModuleInsight> {
  const start = dayStart();
  const monthStart = new Date(start.getFullYear(), start.getMonth(), 1);

  const [ordersToday, ordersMonth, posToday, posMonth, profitSnap] = await Promise.all([
    prisma.order.aggregate({
      where: { createdAt: { gte: start }, paymentStatus: "CAPTURED" },
      _sum: { total: true },
      _count: true,
    }),
    prisma.order.aggregate({
      where: { createdAt: { gte: monthStart }, paymentStatus: "CAPTURED" },
      _sum: { total: true },
    }),
    prisma.posBill.aggregate({
      where: { createdAt: { gte: start }, status: "COMPLETED" },
      _sum: { total: true },
      _count: { id: true },
    }),
    prisma.posBill.aggregate({
      where: { createdAt: { gte: monthStart }, status: "COMPLETED" },
      _sum: { total: true },
    }),
    prisma.predictionSnapshot.findFirst({
      where: { domain: "PROFIT" },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const todayRev = Number(ordersToday._sum?.total ?? 0) + Number(posToday._sum.total ?? 0);
  const monthRev = Number(ordersMonth._sum?.total ?? 0) + Number(posMonth._sum.total ?? 0);
  const orderCountToday = typeof ordersToday._count === "number" ? ordersToday._count : 0;

  return {
    title: "Finance Overview",
    summary: `Today ₹${todayRev.toLocaleString()} revenue (${orderCountToday} online orders, ${posToday._count} POS bills). Month-to-date ₹${monthRev.toLocaleString()}.`,
    score: profitSnap?.pointValue ? Math.min(100, profitSnap.pointValue) : 75,
    metrics: {
      todayRevenue: todayRev,
      monthRevenue: monthRev,
      profitForecast: profitSnap?.pointValue ?? 0,
    },
    recommendations: [
      monthRev < 100000
        ? "Review subscription renewals and bulk order outreach"
        : "Revenue on track",
      "Reconcile POS cash drawer with daily settlement",
    ],
  };
}

export async function analyzeFarm(): Promise<ModuleInsight> {
  const [milk, devices, emergencies, cows, batches] = await Promise.all([
    prisma.predictionSnapshot.findFirst({
      where: { domain: "MILK" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.ioTDevice.count({ where: { status: "ONLINE" } }),
    prisma.emergencyEvent.count({ where: { acknowledgedAt: null, severity: "CRITICAL" } }),
    prisma.cow.count({ where: { status: "ACTIVE" } }),
    prisma.procBatch.count({ where: { status: { in: ["IN_PROGRESS", "QC_PENDING"] } } }),
  ]);

  return {
    title: "Farm Operations",
    summary: milk
      ? `Milk forecast: ${milk.pointValue}L (${milk.valueLow}-${milk.valueHigh}L). ${cows} active cows, ${devices} IoT devices online.`
      : `${cows} active cows, ${devices} IoT devices online.`,
    score: emergencies > 0 ? 40 : 85,
    metrics: {
      milkForecastL: milk?.pointValue ?? 0,
      activeCows: cows,
      iotOnline: devices,
      criticalAlerts: emergencies,
      activeBatches: batches,
    },
    recommendations: [
      emergencies > 0 ? "Acknowledge critical farm alerts immediately" : "No critical farm alerts",
      "Run daily milk prediction cron",
    ],
  };
}

export async function analyzeInventory(): Promise<ModuleInsight> {
  const [lowStock, outOfStock, expiringLabels, processingBatches] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true, stockQty: { lt: 20, gt: 0 } },
      select: { name: true, stockQty: true },
      take: 10,
    }),
    prisma.product.count({ where: { isActive: true, stockQty: 0 } }),
    prisma.procLabel.count({
      where: {
        expiryDate: { lte: new Date(Date.now() + 7 * 86400_000), gte: new Date() },
      },
    }),
    prisma.procBatch.count({ where: { status: "PACKAGED" } }),
  ]);

  const invSnap = await prisma.predictionSnapshot.findFirst({
    where: { domain: "INVENTORY" },
    orderBy: { createdAt: "desc" },
  });

  return {
    title: "Inventory Intelligence",
    summary: `${lowStock.length} products low stock, ${outOfStock} out of stock, ${expiringLabels} labels expiring within 7 days.`,
    score: outOfStock > 5 ? 50 : 80,
    metrics: {
      lowStockCount: lowStock.length,
      outOfStock,
      expiringSoon: expiringLabels,
      packagedBatches: processingBatches,
      demandForecast: invSnap?.pointValue ?? 0,
    },
    recommendations: lowStock.map((p) => `Restock ${p.name} (${p.stockQty} left)`).slice(0, 5),
  };
}

export async function analyzeMarketing(): Promise<ModuleInsight> {
  const [leads, campaigns, referrals] = await Promise.all([
    prisma.crmLead.count({ where: { status: { notIn: ["LOST", "CONVERTED"] } } }),
    prisma.crmCampaign.count({ where: { status: "ACTIVE" } }),
    prisma.crmReferral.count({ where: { status: "pending" } }),
  ]);

  return {
    title: "Marketing Performance",
    summary: `${leads} active leads, ${campaigns} live campaigns, ${referrals} pending referrals.`,
    score: leads > 10 ? 78 : 60,
    metrics: { activeLeads: leads, activeCampaigns: campaigns, pendingReferrals: referrals },
    recommendations: [
      "Launch WhatsApp campaign for monsoon ghee promo",
      "Sync referral codes from customer signups",
    ],
  };
}

export async function analyzeSales(): Promise<ModuleInsight> {
  const [pipeline, openDeals, posWeek, quotations] = await Promise.all([
    prisma.crmOpportunity.aggregate({
      where: { stage: { notIn: ["CLOSED_WON", "CLOSED_LOST"] } },
      _sum: { amount: true },
      _count: { id: true },
    }),
    prisma.crmOpportunity.count({
      where: { stage: { in: ["PROPOSAL", "NEGOTIATION"] } },
    }),
    prisma.posBill.aggregate({
      where: {
        createdAt: { gte: new Date(Date.now() - 7 * 86400_000) },
        status: "COMPLETED",
      },
      _sum: { total: true },
    }),
    prisma.crmQuotation.count({ where: { status: "SENT" } }),
  ]);

  return {
    title: "Sales Pipeline",
    summary: `₹${Number(pipeline._sum.amount ?? 0).toLocaleString()} in ${pipeline._count.id} open deals. ${quotations} quotations pending.`,
    score: openDeals > 3 ? 82 : 65,
    metrics: {
      pipelineValue: Number(pipeline._sum.amount ?? 0),
      openDeals: pipeline._count.id,
      posWeekRevenue: Number(posWeek._sum.total ?? 0),
      pendingQuotations: quotations,
    },
    recommendations: ["Follow up on sent quotations", "Convert qualified leads to opportunities"],
  };
}

export async function analyzeCustomer(): Promise<ModuleInsight> {
  const [openTickets, loyalty, subs, recentReturns] = await Promise.all([
    prisma.crmSupportTicket.count({
      where: { status: { in: ["OPEN", "IN_PROGRESS", "WAITING_CUSTOMER"] } },
    }),
    prisma.posLoyaltyAccount.count(),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
    prisma.posReturn.count({
      where: { createdAt: { gte: new Date(Date.now() - 30 * 86400_000) } },
    }),
  ]);

  return {
    title: "Customer Experience",
    summary: `${openTickets} open support tickets, ${loyalty} loyalty members, ${subs} active subscriptions.`,
    score: openTickets > 10 ? 55 : 88,
    metrics: {
      openTickets,
      loyaltyMembers: loyalty,
      activeSubscriptions: subs,
      returns30d: recentReturns,
    },
    recommendations: [
      openTickets > 5 ? "Prioritize ticket resolution SLA" : "Support queue healthy",
      "Send loyalty rewards to top customers",
    ],
  };
}

export async function analyzeCeo(): Promise<ModuleInsight> {
  const [finance, farm, inventory, sales, customer] = await Promise.all([
    analyzeFinance(),
    analyzeFarm(),
    analyzeInventory(),
    analyzeSales(),
    analyzeCustomer(),
  ]);

  const scores = [
    finance.score ?? 70,
    farm.score ?? 70,
    inventory.score ?? 70,
    sales.score ?? 70,
    customer.score ?? 70,
  ];
  const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  return {
    title: "CEO Executive Summary",
    summary: `Business health score ${avgScore}/100. ${finance.summary.split(".")[0]}. ${farm.summary.split(".")[0]}.`,
    score: avgScore,
    metrics: {
      financeScore: finance.score ?? 0,
      farmScore: farm.score ?? 0,
      inventoryScore: inventory.score ?? 0,
      salesScore: sales.score ?? 0,
      customerScore: customer.score ?? 0,
      todayRevenue: finance.metrics?.todayRevenue ?? 0,
    },
    recommendations: [
      ...(finance.recommendations ?? []).slice(0, 1),
      ...(farm.recommendations ?? []).slice(0, 1),
      ...(inventory.recommendations ?? []).slice(0, 1),
      ...(sales.recommendations ?? []).slice(0, 1),
    ],
  };
}
