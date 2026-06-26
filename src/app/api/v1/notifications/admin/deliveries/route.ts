import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { getDeliveryReports } from "@/modules/notifications/analytics";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requirePermission("admin:notifications:read");
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const reports = await getDeliveryReports(null, {
    limit: Number(searchParams.get("limit") || 50),
    status: searchParams.get("status") || undefined,
    channel: searchParams.get("channel") || undefined,
  });

  return NextResponse.json({ reports });
}
