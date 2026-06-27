import { getRazorpayClient } from "@/utils/razorpayServer";

const TOTAL_COUNT = {
  daily: 365,
  weekly: 52,
  monthly: 12,
};

const LOG = "[AutoPay]";

export function logRazorpayError(context, err) {
  console.error(`${LOG} Razorpay error — ${context}`, {
    statusCode: err?.statusCode ?? null,
    code: err?.error?.code ?? err?.code ?? null,
    description: err?.error?.description ?? err?.description ?? null,
    reason: err?.error?.reason ?? null,
    field: err?.error?.field ?? null,
    source: err?.error?.source ?? null,
    step: err?.error?.step ?? null,
    message: err?.message ?? null,
    error: err?.error ?? null,
    raw: err,
  });
}

export function mapFrequencyToRazorpayPlan(frequency) {
  switch (frequency) {
    case "DAILY":
      return { period: "daily", interval: 1, total_count: TOTAL_COUNT.daily };
    case "ALTERNATE_DAY":
      return { period: "daily", interval: 2, total_count: Math.floor(TOTAL_COUNT.daily / 2) };
    case "WEEKLY":
      return { period: "weekly", interval: 1, total_count: TOTAL_COUNT.weekly };
    case "MONTHLY":
      return { period: "monthly", interval: 1, total_count: TOTAL_COUNT.monthly };
    case "CUSTOM":
      return { period: "weekly", interval: 1, total_count: TOTAL_COUNT.weekly };
    default:
      return { period: "daily", interval: 1, total_count: TOTAL_COUNT.daily };
  }
}

export async function createRazorpayBillingPlan({
  productName,
  amountPaise,
  frequency,
  subscriptionId,
}) {
  console.log(`${LOG} createRazorpayBillingPlan() entered`, {
    subscriptionId,
    productName,
    amountPaise,
    frequency,
  });

  const razorpay = getRazorpayClient();
  if (!razorpay) {
    console.error(`${LOG} createRazorpayBillingPlan() — Razorpay client not configured`, {
      hasKeyId: Boolean(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID),
      hasKeySecret: Boolean(process.env.RAZORPAY_KEY_SECRET),
    });
    return null;
  }

  const planMeta = mapFrequencyToRazorpayPlan(frequency);
  console.log(`${LOG} createRazorpayBillingPlan() plan meta`, planMeta);

  try {
    console.log(`${LOG} before razorpay.plans.create()`, {
      period: planMeta.period,
      interval: planMeta.interval,
      amountPaise,
    });

    const plan = await razorpay.plans.create({
      period: planMeta.period,
      interval: planMeta.interval,
      item: {
        name: `Kunwar ${productName}`.slice(0, 250),
        amount: amountPaise,
        currency: "INR",
        description: `Milk subscription — ${frequency.replace(/_/g, " ").toLowerCase()}`,
      },
      notes: {
        app: "shree-shyam-dairy-farm",
        subscriptionId,
      },
    });

    console.log(`${LOG} razorpay.plans.create() success`, { planId: plan.id });

    console.log(`${LOG} before razorpay.subscriptions.create()`, {
      planId: plan.id,
      total_count: planMeta.total_count,
    });

    const rzSub = await razorpay.subscriptions.create({
      plan_id: plan.id,
      total_count: planMeta.total_count,
      quantity: 1,
      customer_notify: 1,
      notes: {
        subscriptionId,
        source: "ssd_milk_subscription",
      },
    });

    console.log(`${LOG} razorpay.subscriptions.create() success`, {
      razorpaySubscriptionId: rzSub.id,
      status: rzSub.status,
      shortUrl: rzSub.short_url,
    });

    return {
      planId: plan.id,
      razorpaySubscriptionId: rzSub.id,
      shortUrl: rzSub.short_url,
      status: rzSub.status,
    };
  } catch (err) {
    logRazorpayError("createRazorpayBillingPlan() catch", err);
    return null;
  }
}
