import { prisma } from "@/repositories/prisma";
import { TENANT_PLANS, type TenantPlan } from "@/constants/tenant";

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes("your_"));
}

export async function getStripeClient() {
  if (!isStripeConfigured()) return null;
  const Stripe = (await import("stripe")).default;
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

export async function createStripeCheckoutSession(
  tenantId: string,
  plan: TenantPlan,
  successUrl: string,
  cancelUrl: string
) {
  const stripe = await getStripeClient();
  if (!stripe) throw new Error("Stripe not configured");

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { subscription: true },
  });
  if (!tenant) throw new Error("Tenant not found");

  const planConfig = TENANT_PLANS[plan];
  const priceInr = planConfig.priceInr;

  let customerId = tenant.subscription?.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      name: tenant.name,
      metadata: { tenantId, slug: tenant.slug },
    });
    customerId = customer.id;
    await prisma.tenantBillingSubscription.upsert({
      where: { tenantId },
      create: { tenantId, stripeCustomerId: customerId, billingProvider: "stripe" },
      update: { stripeCustomerId: customerId, billingProvider: "stripe" },
    });
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    success_url: successUrl,
    cancel_url: cancelUrl,
    line_items: [
      {
        price_data: {
          currency: "inr",
          unit_amount: priceInr * 100,
          recurring: { interval: "month" },
          product_data: { name: `SSD ERP ${planConfig.name} Plan` },
        },
        quantity: 1,
      },
    ],
    metadata: { tenantId, plan },
  });

  return { url: session.url, sessionId: session.id };
}

export async function handleStripeWebhook(event: {
  type: string;
  data: { object: Record<string, unknown> };
}) {
  const obj = event.data.object;

  if (event.type === "checkout.session.completed") {
    const tenantId = obj.metadata as { tenantId?: string; plan?: string };
    if (tenantId?.tenantId) {
      await prisma.tenantBillingSubscription.update({
        where: { tenantId: tenantId.tenantId },
        data: {
          status: "active",
          plan: tenantId.plan || "growth",
          stripeSubscriptionId: String(obj.subscription || ""),
        },
      });
      await prisma.tenant.update({
        where: { id: tenantId.tenantId },
        data: { plan: tenantId.plan || "growth" },
      });
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subId = String(obj.id);
    const sub = await prisma.tenantBillingSubscription.findFirst({
      where: { stripeSubscriptionId: subId },
    });
    if (sub) {
      await prisma.tenantBillingSubscription.update({
        where: { tenantId: sub.tenantId },
        data: { status: "cancelled" },
      });
    }
  }
}
