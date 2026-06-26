import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/repositories/prisma";
import { requireUser } from "@/lib/auth/session";
import { processVoiceInput, getOrCreateVoiceProfile } from "@/services/farm/voice.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const body = await request.json();

  if (body.transcript) {
    const { user, error } = await requireUser();
    if (error) return error;
    const result = await processVoiceInput(user!.id, body.transcript, body.locale || "HI_IN");
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: "transcript required" }, { status: 400 });
}

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({}, { status: 503 });
  }
  const { user, error } = await requireUser();
  if (error) return error;
  const profile = await getOrCreateVoiceProfile(user!.id);
  return NextResponse.json({ profile });
}
