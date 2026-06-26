import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { savePushSubscription, removePushSubscription } from "@/services/mobile/platform.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const body = await request.json();
  if (!body?.endpoint || !body?.keys?.p256dh || !body?.keys?.auth) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }

  await savePushSubscription(
    auth.user!.id,
    { endpoint: body.endpoint, keys: body.keys },
    request.headers.get("user-agent") || undefined
  );

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const body = await request.json();
  if (body?.endpoint) await removePushSubscription(body.endpoint);

  return NextResponse.json({ success: true });
}
