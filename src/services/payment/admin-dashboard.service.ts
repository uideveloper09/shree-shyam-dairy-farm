/**
 * Admin payment dashboard metrics (e-commerce / Razorpay).
 */
import { OrderStatus, PaymentStatus, type PaymentMethod } from "@prisma/client";
import { prisma } from "@/repositories/prisma";

const PAID_PAYMENT_STATUSES: PaymentStatus[] = [
  PaymentStatus.PAID,
  PaymentStatus.CAPTURED,
  PaymentStatus.AUTHORIZED,
];

export interface PaymentDashboardTransaction {
  id: string;
  orderId: string;
  orderNumber: string;
  amount: number;
  currency: string;
  status: string;
  method: PaymentMethod;
  razorpayPaymentId: string | null;
  paymentDate: string;
  createdAt: string;
}

export interface PaymentMethodBreakdown {
  method: PaymentMethod;
  count: number;
  amount: number;
}

export interface PaymentDailyTrend {
  date: string;
  revenue: number;
  orders: number;
}

export interface PaymentDashboardAnalytics {
  byMethod: PaymentMethodBreakdown[];
  last7Days: PaymentDailyTrend[];
  successRate: number;
  totalTransactions: number;
}

export interface PaymentDashboardMetrics {
  totalRevenue: number;
  todaysSales: number;
  pendingOrders: number;
  paidOrders: number;
  failedPayments: number;
  recentTransactions: PaymentDashboardTransaction[];
  analytics: PaymentDashboardAnalytics;
  generatedAt: string;
}

function startOfToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function startOfDaysAgo(days: number): Date {
  const date = startOfToday();
  date.setDate(date.getDate() - days);
  return date;
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Loads all payment dashboard metrics from the database.
 */
export async function getPaymentDashboardMetrics(): Promise<PaymentDashboardMetrics> {
  const today = startOfToday();
  const sevenDaysAgo = startOfDaysAgo(6);

  const [
    totalRevenueAgg,
    todaysSalesAgg,
    pendingOrders,
    paidOrders,
    failedPayments,
    recentPayments,
    paymentsByMethod,
    recentWeekPayments,
    paidPaymentCount,
  ] = await Promise.all([
    prisma.payment.aggregate({
      where: { status: { in: PAID_PAYMENT_STATUSES } },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: {
        status: { in: PAID_PAYMENT_STATUSES },
        paymentDate: { gte: today },
      },
      _sum: { amount: true },
    }),
    prisma.order.count({
      where: {
        status: { notIn: [OrderStatus.CANCELLED, OrderStatus.REFUNDED] },
        paymentStatus: PaymentStatus.PENDING,
      },
    }),
    prisma.order.count({
      where: { paymentStatus: PaymentStatus.PAID },
    }),
    prisma.payment.count({
      where: { status: PaymentStatus.FAILED },
    }),
    prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        order: { select: { orderNumber: true } },
      },
    }),
    prisma.payment.groupBy({
      by: ["method"],
      where: { status: { in: PAID_PAYMENT_STATUSES } },
      _count: { id: true },
      _sum: { amount: true },
    }),
    prisma.payment.findMany({
      where: {
        status: { in: PAID_PAYMENT_STATUSES },
        paymentDate: { gte: sevenDaysAgo },
      },
      select: {
        amount: true,
        paymentDate: true,
        orderId: true,
      },
    }),
    prisma.payment.count({ where: { status: { in: PAID_PAYMENT_STATUSES } } }),
  ]);

  const last7Days = buildLast7DaysTrend(recentWeekPayments, sevenDaysAgo);

  const byMethod: PaymentMethodBreakdown[] = paymentsByMethod.map((row) => ({
    method: row.method,
    count: row._count.id,
    amount: Number(row._sum.amount ?? 0),
  }));

  const totalAttempts = paidPaymentCount + failedPayments;
  const successRate =
    totalAttempts > 0 ? Math.round((paidPaymentCount / totalAttempts) * 1000) / 10 : 100;

  return {
    totalRevenue: Number(totalRevenueAgg._sum.amount ?? 0),
    todaysSales: Number(todaysSalesAgg._sum.amount ?? 0),
    pendingOrders,
    paidOrders,
    failedPayments,
    recentTransactions: recentPayments.map((payment) => ({
      id: payment.id,
      orderId: payment.orderId,
      orderNumber: payment.order.orderNumber,
      amount: Number(payment.amount),
      currency: payment.currency,
      status: payment.status,
      method: payment.method,
      razorpayPaymentId: payment.razorpayPaymentId,
      paymentDate: payment.paymentDate.toISOString(),
      createdAt: payment.createdAt.toISOString(),
    })),
    analytics: {
      byMethod,
      last7Days,
      successRate,
      totalTransactions: totalAttempts,
    },
    generatedAt: new Date().toISOString(),
  };
}

function buildLast7DaysTrend(
  payments: Array<{ amount: unknown; paymentDate: Date; orderId: string }>,
  startDate: Date
): PaymentDailyTrend[] {
  const buckets = new Map<string, { revenue: number; orderIds: Set<string> }>();

  for (let i = 0; i < 7; i += 1) {
    const day = new Date(startDate);
    day.setDate(startDate.getDate() + i);
    buckets.set(toIsoDate(day), { revenue: 0, orderIds: new Set() });
  }

  for (const payment of payments) {
    const key = toIsoDate(payment.paymentDate);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.revenue += Number(payment.amount);
    bucket.orderIds.add(payment.orderId);
  }

  return [...buckets.entries()].map(([date, value]) => ({
    date,
    revenue: Math.round(value.revenue * 100) / 100,
    orders: value.orderIds.size,
  }));
}
