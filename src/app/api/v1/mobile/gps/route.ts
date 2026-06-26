import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { recordGpsPing } from "@/services/mobile/platform.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const body = await request.json();
  if (typeof body.latitude !== "number" || typeof body.longitude !== "number") {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  const ping = await recordGpsPing(auth.user!.id, {
    latitude: body.latitude,
    longitude: body.longitude,
    accuracy: body.accuracy,
    context: body.context,
    metadata: body.metadata,
  });

  return NextResponse.json({ id: ping.id });
}
