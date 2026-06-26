import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { isDatabaseConfigured, prisma } from "@/lib/db/prisma";
import {
  calculateNextDelivery,
  syncUpcomingDeliveries,
} from "@/lib/services/subscription";
import { serializeSubscription } from "@/lib/services/subscription-serialize";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { user, error } = await requireUser();
  if (error) return error;

  const { id } = await params;
  const sub = await prisma.subscription.findFirst({ where: { id, userId: user!.id } });
  if (!sub) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const nextDelivery = calculateNextDelivery(
    sub.frequency,
    sub.customDays,
    new Date(),
    sub.nextDelivery
  );

  const updated = await prisma.subscription.update({
    where: { id },
    data: {
      status: "ACTIVE",
      pausedUntil: null,
      vacationUntil: null,
      nextDelivery,
    },
    include: {
      product: {
        select: { id: true, name: true, price: true, unit: true, images: true, legacyId: true },
      },
      deliveries: { orderBy: { scheduledDate: "asc" } },
    },
  });

  await syncUpcomingDeliveries(id, updated, prisma);

  const full = await prisma.subscription.findUnique({
    where: { id },
    include: {
      product: {
        select: { id: true, name: true, price: true, unit: true, images: true, legacyId: true },
      },
      deliveries: { orderBy: { scheduledDate: "asc" } },
    },
  });

  return NextResponse.json({ subscription: serializeSubscription(full!) });
}
