import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { getNotificationHistory } from "@/services/notifications/service";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requirePermission("notifications:read");
  if (auth.error) return auth.error;

  const history = await getNotificationHistory(auth.user!.id);
  return NextResponse.json({ history });
}
