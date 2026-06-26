import { NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/auth/session";
import { listWhatsAppSessions, processWhatsAppMessage } from "@/services/ai-platform/service";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAnyPermission(["ai:read", "admin:ai:read"]);
  if (auth.error) return auth.error;

  return NextResponse.json({ sessions: await listWhatsAppSessions() });
}

export async function POST(request: Request) {
  const auth = await requireAnyPermission(["ai:write", "admin:ai:write"]);
  if (auth.error) return auth.error;

  const body = await request.json();
  if (!body.phone || !body.message) {
    return NextResponse.json({ error: "phone and message required" }, { status: 400 });
  }

  const result = await processWhatsAppMessage(body.phone, body.message, auth.user?.id);
  return NextResponse.json(result);
}
