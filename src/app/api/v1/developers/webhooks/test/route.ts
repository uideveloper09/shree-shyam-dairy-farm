import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { isDatabaseConfigured } from "@/repositories/prisma";
import { getOrCreateDeveloperAccount } from "@/services/api/developer.service";
import { dispatchWebhookEvent } from "@/lib/api/webhooks";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const auth = await requireUser();
  if (auth.error) return auth.error;

  await getOrCreateDeveloperAccount(auth.user!.id);

  const body = await request.json().catch(() => ({}));
  const event = (body.event as string) || "order.created";

  const result = await dispatchWebhookEvent(event as "order.created", {
    test: true,
    triggeredBy: auth.user!.id,
    timestamp: new Date().toISOString(),
  });

  return NextResponse.json({ success: true, ...result });
}
