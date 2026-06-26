import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { processVoiceInput } from "@/services/ai-platform/service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requirePermission("ai:write");
  if (auth.error) return auth.error;

  const body = await request.json();
  if (!body.transcript) {
    return NextResponse.json({ error: "transcript required" }, { status: 400 });
  }

  const result = await processVoiceInput(auth.user!.id, body.transcript, body.locale || "HI_IN");
  return NextResponse.json(result);
}
