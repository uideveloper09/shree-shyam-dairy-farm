import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { removePushSubscription } from "@/services/mobile/platform.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const body = await request.json();
  if (body?.endpoint) await removePushSubscription(body.endpoint);

  return NextResponse.json({ success: true });
}
