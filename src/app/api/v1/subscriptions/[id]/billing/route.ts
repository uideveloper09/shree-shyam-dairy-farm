import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { isDatabaseConfigured, prisma } from "@/repositories/prisma";
import { createRazorpayBillingPlan } from "@/utils/razorpaySubscriptions";
import { serializeSubscription } from "@/services/subscription-serialize";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { user, error } = await requireUser();
  if (error) return error;

  const { id } = await params;

  const sub = await prisma.subscription.findFirst({
    where: { id, userId: user!.id },
    include: {
      product: true,
      deliveries: { orderBy: { scheduledDate: "asc" } },
    },
  });

  if (!sub) {
    return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
  }

  if (sub.razorpaySubId) {
    return NextResponse.json(
      {
        error: "Auto-pay already set up for this subscription",
        razorpaySubId: sub.razorpaySubId,
      },
      { status: 400 }
    );
  }

  const amountPaise = Math.round(Number(sub.product.price) * sub.quantity * 100);
  const billing = await createRazorpayBillingPlan({
    productName: sub.product.name,
    amountPaise,
    frequency: sub.frequency,
    subscriptionId: sub.id,
  });

  if (!billing) {
    return NextResponse.json(
      {
        error:
          "Razorpay Subscriptions is not available on this account yet. Enable Subscriptions in Razorpay Dashboard or pay per delivery manually.",
      },
      { status: 503 }
    );
  }

  const updated = await prisma.subscription.update({
    where: { id },
    data: { razorpaySubId: billing.razorpaySubscriptionId },
    include: {
      product: {
        select: { id: true, name: true, price: true, unit: true, images: true, legacyId: true },
      },
      deliveries: { orderBy: { scheduledDate: "asc" } },
    },
  });

  return NextResponse.json({
    subscription: serializeSubscription(updated),
    billing: {
      shortUrl: billing.shortUrl,
      razorpaySubscriptionId: billing.razorpaySubscriptionId,
      status: billing.status,
    },
  });
}
