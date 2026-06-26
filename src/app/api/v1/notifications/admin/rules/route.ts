import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { createRule, listRules } from "@/services/notifications/service";
import type { NotificationChannel } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requirePermission("admin:notifications:read");
  if (auth.error) return auth.error;

  const rules = await listRules();
  return NextResponse.json({ rules });
}

export async function POST(request: Request) {
  const auth = await requirePermission("admin:notifications:write");
  if (auth.error) return auth.error;

  const body = await request.json();
  const rule = await createRule({
    name: body.name,
    event: body.event,
    templateId: body.templateId,
    channels: body.channels as NotificationChannel[],
    conditions: body.conditions,
    priority: body.priority,
  });

  return NextResponse.json({ rule }, { status: 201 });
}
