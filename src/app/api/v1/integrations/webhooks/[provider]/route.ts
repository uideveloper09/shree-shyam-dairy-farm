import { NextResponse } from "next/server";
import { handleInboundWebhook } from "@/modules/integrations/webhook-engine";
import type { IntegrationProvider } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ provider: string }> }) {
  const { provider } = await context.params;
  const body = await request.text();

  try {
    const result = await handleInboundWebhook(
      provider.toUpperCase() as IntegrationProvider,
      request.headers,
      body
    );

    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

export async function GET(request: Request, context: { params: Promise<{ provider: string }> }) {
  const { provider } = await context.params;
  if (provider.toLowerCase() === "whatsapp") {
    const mode =
      request.headers.get("hub.mode") || new URL(request.url).searchParams.get("hub.mode");
    const token = new URL(request.url).searchParams.get("hub.verify_token");
    const challenge = new URL(request.url).searchParams.get("hub.challenge");
    if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      return new NextResponse(challenge || "", { status: 200 });
    }
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json({ status: "ok", provider });
}
