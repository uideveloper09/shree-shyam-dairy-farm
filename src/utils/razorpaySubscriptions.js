import { getRazorpayClient } from "@/utils/razorpayServer";

const TOTAL_COUNT = {
  daily: 365,
  weekly: 52,
  monthly: 12,
};

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
  const razorpay = getRazorpayClient();
  if (!razorpay) return null;

  const planMeta = mapFrequencyToRazorpayPlan(frequency);

  try {
    const plan = await razorpay.plans.create({
      period: planMeta.period,
      interval: planMeta.interval,
      item: {
        name: `SSD ${productName}`.slice(0, 250),
        amount: amountPaise,
        currency: "INR",
        description: `Milk subscription — ${frequency.replace(/_/g, " ").toLowerCase()}`,
      },
      notes: {
        app: "shree-shyam-dairy-farm",
        subscriptionId,
      },
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

    return {
      planId: plan.id,
      razorpaySubscriptionId: rzSub.id,
      shortUrl: rzSub.short_url,
      status: rzSub.status,
    };
  } catch (err) {
    console.error("Razorpay subscription billing error:", err?.error || err);
    return null;
  }
}
