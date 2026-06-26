import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { markNotificationRead } from "@/services/notifications/service";

export const dynamic = "force-dynamic";

export async function PATCH(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission("notifications:read");
  if (auth.error) return auth.error;

  const { id } = await context.params;
  await markNotificationRead(auth.user!.id, id);

  return NextResponse.json({ ok: true });
}
