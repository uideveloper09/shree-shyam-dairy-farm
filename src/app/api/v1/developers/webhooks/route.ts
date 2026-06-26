import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { isDatabaseConfigured } from "@/repositories/prisma";
import {
  createWebhookEndpoint,
  deleteWebhookEndpoint,
  getOrCreateDeveloperAccount,
} from "@/services/api/developer.service";
import { WEBHOOK_EVENTS } from "@/lib/api/scopes";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const auth = await requireUser();
  if (auth.error) return auth.error;

  const account = await getOrCreateDeveloperAccount(auth.user!.id);
  return NextResponse.json({
    webhooks: account.webhooks,
    availableEvents: WEBHOOK_EVENTS,
  });
}

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const auth = await requireUser();
  if (auth.error) return auth.error;

  const body = await request.json();
  const url = typeof body.url === "string" ? body.url.trim() : "";
  const events = Array.isArray(body.events) ? body.events.map(String) : [];

  if (!url || !events.length) {
    return NextResponse.json({ error: "url and events are required" }, { status: 400 });
  }

  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const account = await getOrCreateDeveloperAccount(auth.user!.id);
  const webhook = await createWebhookEndpoint(account.id, { url, events });

  return NextResponse.json({
    webhook: {
      id: webhook.id,
      url: webhook.url,
      events: webhook.events,
      secret: webhook.secret,
      isActive: webhook.isActive,
    },
    warning: "Store webhook secret for signature verification.",
  });
}

export async function DELETE(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const auth = await requireUser();
  if (auth.error) return auth.error;

  const body = await request.json();
  const id = typeof body.id === "string" ? body.id : "";
  if (!id) return NextResponse.json({ error: "Webhook id required" }, { status: 400 });

  const account = await getOrCreateDeveloperAccount(auth.user!.id);
  const result = await deleteWebhookEndpoint(account.id, id);

  return NextResponse.json({ deleted: result.count > 0 });
}
