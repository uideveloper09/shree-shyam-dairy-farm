import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { isDatabaseConfigured, prisma } from "@/repositories/prisma";
import { calculateNextDelivery } from "@/services/subscription";
import { serializeSubscription } from "@/services/subscription-serialize";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function POST(_request: Request, { params }: Params) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { user, error } = await requireUser();
  if (error) return error;

  const { id } = await params;
  const sub = await prisma.subscription.findFirst({ where: { id, userId: user!.id } });
  if (!sub) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const tomorrow = startOfDay(new Date());
  tomorrow.setDate(tomorrow.getDate() + 1);

  const existing = await prisma.subscriptionDelivery.findFirst({
    where: {
      subscriptionId: id,
      scheduledDate: {
        gte: tomorrow,
        lt: new Date(tomorrow.getTime() + 86400000),
      },
    },
  });

  if (existing) {
    await prisma.subscriptionDelivery.update({
      where: { id: existing.id },
      data: { skipped: true, status: "skipped" },
    });
  } else {
    await prisma.subscriptionDelivery.create({
      data: {
        subscriptionId: id,
        scheduledDate: tomorrow,
        skipped: true,
        status: "skipped",
      },
    });
  }

  const nextDelivery = calculateNextDelivery(sub.frequency, sub.customDays, tomorrow, tomorrow);

  const updated = await prisma.subscription.update({
    where: { id },
    data: { nextDelivery },
    include: {
      product: {
        select: { id: true, name: true, price: true, unit: true, images: true, legacyId: true },
      },
      deliveries: { orderBy: { scheduledDate: "asc" } },
    },
  });

  return NextResponse.json({ subscription: serializeSubscription(updated) });
}
