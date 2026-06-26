import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { isDatabaseConfigured, prisma } from "@/lib/db/prisma";
import { pauseSchema } from "@/lib/validators/subscription";
import { serializeSubscription } from "@/lib/services/subscription-serialize";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { user, error } = await requireUser();
  if (error) return error;

  const { id } = await params;
  const sub = await prisma.subscription.findFirst({ where: { id, userId: user!.id } });
  if (!sub) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const parsed = pauseSchema.safeParse(body);
  const pausedUntil = parsed.success && parsed.data.until ? new Date(parsed.data.until) : null;

  const updated = await prisma.subscription.update({
    where: { id },
    data: {
      status: "PAUSED",
      pausedUntil: pausedUntil ?? new Date(Date.now() + 7 * 86400000),
    },
    include: {
      product: {
        select: { id: true, name: true, price: true, unit: true, images: true, legacyId: true },
      },
      deliveries: { orderBy: { scheduledDate: "asc" } },
    },
  });

  return NextResponse.json({ subscription: serializeSubscription(updated) });
}
