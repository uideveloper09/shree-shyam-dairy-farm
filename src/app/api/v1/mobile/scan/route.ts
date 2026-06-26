import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { recordBarcodeScan } from "@/services/mobile/platform.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const body = await request.json();
  if (!body?.value) {
    return NextResponse.json({ error: "Scan value required" }, { status: 400 });
  }

  const scan = await recordBarcodeScan(
    auth.user!.id,
    String(body.value),
    body.format,
    body.context
  );

  return NextResponse.json({ id: scan.id, value: scan.value });
}
