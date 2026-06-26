import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { getNotificationAnalytics } from "@/modules/notifications/analytics";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requirePermission("admin:notifications:read");
  if (auth.error) return auth.error;

  const days = Number(new URL(request.url).searchParams.get("days") || 30);
  const analytics = await getNotificationAnalytics(null, days);

  return NextResponse.json(analytics);
}
