import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { createBroadcast } from "@/modules/notifications/scheduler";
import { listBroadcasts } from "@/services/notifications/service";
import type { NotificationChannel } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requirePermission("admin:notifications:read");
  if (auth.error) return auth.error;

  const broadcasts = await listBroadcasts();
  return NextResponse.json({ broadcasts });
}

export async function POST(request: Request) {
  const auth = await requirePermission("admin:notifications:write");
  if (auth.error) return auth.error;

  const body = await request.json();
  const scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : undefined;

  const broadcast = await createBroadcast({
    title: body.title,
    body: body.body,
    channels: body.channels as NotificationChannel[],
    audienceFilter: body.audienceFilter,
    type: body.type,
    priority: body.priority,
    scheduledAt,
    createdById: auth.user!.id,
  });

  return NextResponse.json({ broadcast }, { status: 201 });
}
