import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { isDatabaseConfigured, prisma } from "@/repositories/prisma";
import { createSubscriptionSchema } from "@/lib/validators/subscription";
import { calculateNextDelivery, syncUpcomingDeliveries } from "@/services/subscription";
import { serializeSubscription } from "@/services/subscription-serialize";
import { createRazorpayBillingPlan } from "@/utils/razorpaySubscriptions";

export const dynamic = "force-dynamic";

const include = {
  product: {
    select: { id: true, name: true, price: true, unit: true, images: true, legacyId: true },
  },
  deliveries: {
    where: { scheduledDate: { gte: new Date(Date.now() - 30 * 86400000) } },
    orderBy: { scheduledDate: "asc" as const },
  },
};

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Database not configured", subscriptions: [] },
      { status: 503 }
    );
  }

  const { user, error } = await requireUser();
  if (error) return error;

  const subs = await prisma.subscription.findMany({
    where: { userId: user!.id, status: { not: "CANCELLED" } },
    include,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    subscriptions: subs.map(serializeSubscription),
  });
}

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { user, error } = await requireUser();
  if (error) return error;

  try {
    const body = await request.json();
    const parsed = createSubscriptionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid subscription data" },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const product = await prisma.product.findFirst({
      where: { legacyId: data.productLegacyId, isActive: true, isSubscription: true },
    });

    if (!product) {
      const fallback = await prisma.product.findFirst({
        where: { legacyId: data.productLegacyId, isActive: true },
      });
      if (!fallback) {
        return NextResponse.json(
          { error: "Milk product not found. Run npm run db:seed" },
          { status: 404 }
        );
      }
    }

    const milkProduct =
      product ??
      (await prisma.product.findFirst({
        where: { legacyId: data.productLegacyId, isActive: true },
      }))!;

    const address = await prisma.address.create({
      data: {
        userId: user!.id,
        type: "SHIPPING",
        name: data.address.name,
        phone: data.address.phone,
        line1: data.address.line1,
        line2: data.address.line2,
        city: data.address.city,
        state: data.address.state,
        pincode: data.address.pincode,
        landmark: data.address.landmark,
        isDefault: false,
      },
    });

    const startDate = data.startDate ? new Date(data.startDate) : new Date();
    const customDays = data.frequency === "CUSTOM" ? (data.customDays ?? []) : [];

    if (data.frequency === "CUSTOM" && customDays.length === 0) {
      return NextResponse.json(
        { error: "Select at least one custom delivery day" },
        { status: 400 }
      );
    }

    const nextDelivery = calculateNextDelivery(data.frequency, customDays, startDate);

    const subscription = await prisma.subscription.create({
      data: {
        userId: user!.id,
        productId: milkProduct.id,
        frequency: data.frequency,
        quantity: data.quantity,
        deliverySlot: data.deliverySlot,
        customDays,
        startDate,
        nextDelivery,
        addressId: address.id,
        status: "ACTIVE",
      },
      include: {
        product: {
          select: { id: true, name: true, price: true, unit: true, images: true, legacyId: true },
        },
        deliveries: true,
      },
    });

    await syncUpcomingDeliveries(subscription.id, subscription, prisma);

    const full = await prisma.subscription.findUnique({
      where: { id: subscription.id },
      include: {
        product: {
          select: { id: true, name: true, price: true, unit: true, images: true, legacyId: true },
        },
        deliveries: { orderBy: { scheduledDate: "asc" } },
      },
    });

    let billing = null;
    const amountPaise = Math.round(Number(milkProduct.price) * data.quantity * 100);
    const rzBilling = await createRazorpayBillingPlan({
      productName: milkProduct.name,
      amountPaise,
      frequency: data.frequency,
      subscriptionId: subscription.id,
    });

    if (rzBilling) {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { razorpaySubId: rzBilling.razorpaySubscriptionId },
      });
      billing = {
        shortUrl: rzBilling.shortUrl,
        razorpaySubscriptionId: rzBilling.razorpaySubscriptionId,
        status: rzBilling.status,
      };
      full!.razorpaySubId = rzBilling.razorpaySubscriptionId;
    }

    return NextResponse.json(
      { subscription: serializeSubscription(full!), billing },
      { status: 201 }
    );
  } catch (err) {
    console.error("Create subscription error:", err);
    return NextResponse.json({ error: "Could not create subscription" }, { status: 500 });
  }
}
