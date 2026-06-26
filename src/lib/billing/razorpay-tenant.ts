import { prisma } from "@/repositories/prisma";
import { getRazorpayClient } from "@/utils/razorpayServer";
import { TENANT_PLANS, type TenantPlan } from "@/constants/tenant";

export async function createRazorpayTenantSubscription(tenantId: string, plan: TenantPlan) {
  const razorpay = getRazorpayClient();
  if (!razorpay) throw new Error("Razorpay not configured");

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { subscription: true },
  });
  if (!tenant) throw new Error("Tenant not found");

  const planConfig = TENANT_PLANS[plan];
  const amountPaise = planConfig.priceInr * 100;

  const rzPlan = await razorpay.plans.create({
    period: "monthly",
    interval: 1,
    item: {
      name: `SSD ERP ${planConfig.name}`,
      amount: amountPaise,
      currency: "INR",
    },
  });

  const rzSub = await razorpay.subscriptions.create({
    plan_id: rzPlan.id,
    total_count: 12,
    notes: { tenantId, slug: tenant.slug, plan },
  });

  await prisma.tenantBillingSubscription.upsert({
    where: { tenantId },
    create: {
      tenantId,
      plan,
      status: "active",
      billingProvider: "razorpay",
      razorpaySubscriptionId: rzSub.id,
    },
    update: {
      plan,
      status: "active",
      billingProvider: "razorpay",
      razorpaySubscriptionId: rzSub.id,
    },
  });

  await prisma.tenant.update({ where: { id: tenantId }, data: { plan } });

  return {
    razorpaySubscriptionId: rzSub.id,
    shortUrl: rzSub.short_url,
    planId: rzPlan.id,
  };
}

export async function handleRazorpayTenantWebhook(payload: {
  event: string;
  payload: {
    subscription?: { entity?: { id?: string; status?: string; notes?: Record<string, string> } };
  };
}) {
  const sub = payload.payload.subscription?.entity;
  if (!sub?.id) return;

  const record = await prisma.tenantBillingSubscription.findFirst({
    where: { razorpaySubscriptionId: sub.id },
  });
  if (!record) return;

  if (payload.event === "subscription.activated" || payload.event === "subscription.charged") {
    await prisma.tenantBillingSubscription.update({
      where: { tenantId: record.tenantId },
      data: { status: "active" },
    });
  }

  if (payload.event === "subscription.cancelled" || payload.event === "subscription.halted") {
    await prisma.tenantBillingSubscription.update({
      where: { tenantId: record.tenantId },
      data: { status: "cancelled" },
    });
  }
}
