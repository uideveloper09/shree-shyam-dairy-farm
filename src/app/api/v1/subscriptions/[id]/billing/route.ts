import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { isDatabaseConfigured, prisma } from "@/repositories/prisma";
import { createRazorpayBillingPlan } from "@/utils/razorpaySubscriptions";
import { serializeSubscription } from "@/services/subscription-serialize";

export const dynamic = "force-dynamic";

const LOG = "[AutoPay]";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  console.log(`${LOG} POST /api/v1/subscriptions/:id/billing — route entered`);

  try {
    if (!isDatabaseConfigured()) {
      console.warn(`${LOG} billing route — database not configured`);
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const { user, error } = await requireUser();
    if (error) {
      console.warn(`${LOG} billing route — unauthorized (no valid session)`);
      return error;
    }

    const { id } = await params;
    console.log(`${LOG} billing route — authenticated`, {
      subscriptionId: id,
      userId: user!.id,
    });

    const sub = await prisma.subscription.findFirst({
      where: { id, userId: user!.id },
      include: {
        product: true,
        deliveries: { orderBy: { scheduledDate: "asc" } },
      },
    });

    if (!sub) {
      console.warn(`${LOG} billing route — subscription not found`, { subscriptionId: id });
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    if (sub.razorpaySubId) {
      console.warn(`${LOG} billing route — auto-pay already set up`, {
        subscriptionId: id,
        razorpaySubId: sub.razorpaySubId,
      });
      return NextResponse.json(
        {
          error: "Auto-pay already set up for this subscription",
          razorpaySubId: sub.razorpaySubId,
        },
        { status: 400 }
      );
    }

    const amountPaise = Math.round(Number(sub.product.price) * sub.quantity * 100);
    console.log(`${LOG} billing route — before createRazorpayBillingPlan()`, {
      subscriptionId: id,
      productName: sub.product.name,
      amountPaise,
      frequency: sub.frequency,
      quantity: sub.quantity,
    });

    const billing = await createRazorpayBillingPlan({
      productName: sub.product.name,
      amountPaise,
      frequency: sub.frequency,
      subscriptionId: sub.id,
    });

    if (!billing) {
      console.error(`${LOG} billing route — createRazorpayBillingPlan() returned null`, {
        subscriptionId: id,
      });
      return NextResponse.json(
        {
          error:
            "Razorpay Subscriptions is not available on this account yet. Enable Subscriptions in Razorpay Dashboard or pay per delivery manually.",
        },
        { status: 503 }
      );
    }

    console.log(`${LOG} billing route — billing plan created`, {
      subscriptionId: id,
      razorpaySubscriptionId: billing.razorpaySubscriptionId,
      status: billing.status,
    });

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

    console.log(`${LOG} billing route — success`, { subscriptionId: id });

    return NextResponse.json({
      subscription: serializeSubscription(updated),
      billing: {
        shortUrl: billing.shortUrl,
        razorpaySubscriptionId: billing.razorpaySubscriptionId,
        status: billing.status,
      },
    });
  } catch (err) {
    console.error(`${LOG} billing route — catch`, err);
    return NextResponse.json({ error: "Auto-pay setup failed" }, { status: 500 });
  }
}
