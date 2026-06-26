import { prisma } from "@/repositories/prisma";
import type { PredictionDomain } from "@prisma/client";

function movingAverage(values: number[], weights?: number[]): number {
  if (values.length === 0) return 0;
  if (!weights) return values.reduce((a, b) => a + b, 0) / values.length;
  const wSum = weights.reduce((a, b) => a + b, 0);
  return values.reduce((sum, v, i) => sum + v * weights[i], 0) / wSum;
}

export async function runDemandForecast(farmId = "default") {
  const since = new Date(Date.now() - 30 * 86400000);
  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: since }, status: { not: "CANCELLED" } },
    include: { items: true },
  });

  const dailyUnits: Record<string, number> = {};
  for (const o of orders) {
    const day = o.createdAt.toISOString().slice(0, 10);
    const units = o.items.reduce((s, i) => s + i.quantity, 0);
    dailyUnits[day] = (dailyUnits[day] || 0) + units;
  }

  const series = Object.entries(dailyUnits)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v);

  const last7 = series.slice(-7);
  const weights = [1, 1, 1, 2, 2, 3, 4];
  const forecast = last7.length > 0 ? movingAverage(last7, weights.slice(-last7.length)) : 0;

  const validFrom = new Date();
  const validTo = new Date(Date.now() + 86400000);

  const snapshot = await prisma.predictionSnapshot.create({
    data: {
      domain: "DEMAND",
      horizon: "DAILY",
      farmId,
      pointValue: forecast,
      valueLow: forecast * 0.85,
      valueHigh: forecast * 1.15,
      unit: "units",
      periodStart: validFrom,
      periodEnd: validTo,
      valueJson: { dailyHistory: dailyUnits },
    },
  });

  await prisma.aIPrediction.create({
    data: {
      domain: "DEMAND",
      horizon: "DAILY",
      farmId,
      pointValue: forecast,
      valueLow: forecast * 0.85,
      valueHigh: forecast * 1.15,
      confidence: last7.length >= 5 ? 0.75 : 0.5,
      validFrom,
      validTo,
      valueJson: { source: "orders_30d" },
    },
  });

  return snapshot;
}

export async function runMilkForecast(farmId = "default") {
  const activeSubs = await prisma.subscription.findMany({
    where: { status: "ACTIVE" },
    include: { product: true },
  });

  let liters = 0;
  for (const s of activeSubs) {
    const qty = s.quantity;
    const freq =
      s.frequency === "DAILY"
        ? 1
        : s.frequency === "ALTERNATE_DAY"
          ? 0.5
          : s.frequency === "WEEKLY"
            ? 1 / 7
            : 0.3;
    liters += qty * freq * 1;
  }

  const validFrom = new Date();
  const validTo = new Date(Date.now() + 86400000);

  const snapshot = await prisma.predictionSnapshot.create({
    data: {
      domain: "MILK",
      horizon: "DAILY",
      farmId,
      pointValue: liters,
      valueLow: liters * 0.9,
      valueHigh: liters * 1.1,
      unit: "L",
      periodStart: validFrom,
      periodEnd: validTo,
      valueJson: { proxyFromSubscriptions: true, activeSubs: activeSubs.length },
    },
  });

  await prisma.aIPrediction.create({
    data: {
      domain: "MILK",
      horizon: "DAILY",
      farmId,
      pointValue: liters,
      valueLow: liters * 0.9,
      valueHigh: liters * 1.1,
      confidence: 0.6,
      validFrom,
      validTo,
    },
  });

  return snapshot;
}

export async function runInventoryForecast() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { id: true, name: true, stockQty: true, slug: true },
  });

  const demand = await prisma.predictionSnapshot.findFirst({
    where: { domain: "DEMAND" },
    orderBy: { createdAt: "desc" },
  });

  const dailyDemand = demand?.pointValue ?? 10;
  const forecasts = products.map((p) => {
    const daysOfStock = p.stockQty / Math.max(dailyDemand / products.length, 1);
    return {
      productId: p.id,
      name: p.name,
      stockQty: p.stockQty,
      daysOfStock: Math.round(daysOfStock * 10) / 10,
      reorderSuggested: daysOfStock < 3,
    };
  });

  await prisma.predictionSnapshot.create({
    data: {
      domain: "INVENTORY",
      horizon: "DAILY",
      pointValue: forecasts.filter((f) => f.reorderSuggested).length,
      valueJson: { products: forecasts },
      unit: "sku",
      periodStart: new Date(),
      periodEnd: new Date(Date.now() + 7 * 86400000),
    },
  });

  return forecasts;
}

export async function runProfitForecast() {
  const since = new Date(Date.now() - 30 * 86400000);
  const revenue = await prisma.order.aggregate({
    where: {
      createdAt: { gte: since },
      paymentStatus: "CAPTURED",
    },
    _sum: { total: true },
  });

  const totalRev = Number(revenue._sum.total ?? 0);
  const dailyRev = totalRev / 30;
  const expenseRatio = 0.65;
  const dailyProfit = dailyRev * (1 - expenseRatio);

  await prisma.predictionSnapshot.create({
    data: {
      domain: "PROFIT",
      horizon: "MONTHLY",
      pointValue: dailyProfit * 30,
      valueLow: dailyProfit * 30 * 0.8,
      valueHigh: dailyProfit * 30 * 1.2,
      unit: "INR",
      periodStart: new Date(),
      periodEnd: new Date(Date.now() + 30 * 86400000),
      valueJson: { dailyRevenue: dailyRev, expenseRatio },
    },
  });

  return { monthlyProfit: dailyProfit * 30, dailyRevenue: dailyRev };
}

export async function runProductionPlan(farmId = "default") {
  const milk = await runMilkForecast(farmId);
  const demand = await runDemandForecast(farmId);
  const milkL = milk.pointValue ?? 0;
  const demandL = demand.pointValue ?? 0;
  const surplus = milkL - demandL;

  const planDate = new Date();
  planDate.setUTCHours(0, 0, 0, 0);

  const plan = await prisma.productionPlan.upsert({
    where: {
      farmId_planDate_horizonDays: {
        farmId,
        planDate,
        horizonDays: 7,
      },
    },
    create: {
      farmId,
      planDate,
      horizonDays: 7,
      milkForecastL: milkL,
      demandForecastL: demandL,
      surplusDeficitL: surplus,
      payload: {
        actions:
          surplus > 20
            ? ["Increase paneer production", "Notify sales team"]
            : surplus < -10
              ? ["Alert milk shortage", "Review subscriptions"]
              : ["Maintain current production"],
      },
    },
    update: {
      milkForecastL: milkL,
      demandForecastL: demandL,
      surplusDeficitL: surplus,
    },
  });

  return plan;
}

export async function runDailyPredictions(farmId = "default") {
  const milk = await runMilkForecast(farmId);
  const demand = await runDemandForecast(farmId);
  const inventory = await runInventoryForecast();
  const profit = await runProfitForecast();
  const plan = await runProductionPlan(farmId);

  await prisma.aIInsight.create({
    data: {
      farmId,
      type: "DAILY_FORECAST",
      title: "Daily prediction summary",
      score: 75,
      payload: { milk, demand, profit },
      narrative: `Kal doodh anumaan: ${milk.pointValue}L, maang: ${demand.pointValue} units`,
    },
  });

  return { milk, demand, inventory, profit, plan };
}

export async function getLatestPredictions(domain?: PredictionDomain) {
  return prisma.predictionSnapshot.findMany({
    where: domain ? { domain } : undefined,
    orderBy: { createdAt: "desc" },
    take: domain ? 5 : 20,
  });
}
