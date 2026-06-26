import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { sendNotification } from "@/modules/notifications/dispatcher";
import { dispatchEvent } from "@/modules/notifications/rules";
import type { NotificationChannel } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requirePermission("admin:notifications:write");
  if (auth.error) return auth.error;

  const body = await request.json();

  if (body.event) {
    const results = await dispatchEvent({
      event: body.event,
      userId: body.userId,
      tenantId: body.tenantId,
      payload: body.payload,
    });
    return NextResponse.json({ results });
  }

  const delivery = await sendNotification({
    userId: body.userId,
    channel: body.channel as NotificationChannel,
    title: body.title,
    body: body.body,
    priority: body.priority,
    type: body.type,
    scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
  });

  return NextResponse.json({ delivery });
}
