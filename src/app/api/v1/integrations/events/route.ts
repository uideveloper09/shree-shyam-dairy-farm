import { NextResponse } from "next/server";
import { getWebhookLogs } from "@/modules/integrations/webhook-engine";
import { requirePermission } from "@/lib/auth/session";
import type { IntegrationProvider } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requirePermission("admin:integrations:read");
  if (auth.error) return auth.error;

  const provider = new URL(request.url).searchParams.get("provider") as IntegrationProvider | null;
  const logs = await getWebhookLogs(50, provider || undefined);
  return NextResponse.json({ logs });
}
