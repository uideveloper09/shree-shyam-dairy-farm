import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { createTemplate, listTemplates } from "@/services/notifications/service";
import type { NotificationChannel, NotificationType } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requirePermission("admin:notifications:read");
  if (auth.error) return auth.error;

  const templates = await listTemplates();
  return NextResponse.json({ templates });
}

export async function POST(request: Request) {
  const auth = await requirePermission("admin:notifications:write");
  if (auth.error) return auth.error;

  const body = await request.json();
  const template = await createTemplate({
    slug: body.slug,
    name: body.name,
    channel: body.channel as NotificationChannel,
    type: body.type as NotificationType,
    subject: body.subject,
    body: body.body,
    variables: body.variables,
  });

  return NextResponse.json({ template }, { status: 201 });
}
