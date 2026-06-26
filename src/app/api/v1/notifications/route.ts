import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { getUnreadCount, listUserNotifications } from "@/services/notifications/service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requirePermission("notifications:read");
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get("unread") === "true";

  const [notifications, unreadCount] = await Promise.all([
    listUserNotifications(auth.user!.id, unreadOnly),
    getUnreadCount(auth.user!.id),
  ]);

  return NextResponse.json({ notifications, unreadCount });
}
