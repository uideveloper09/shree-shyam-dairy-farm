import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { getFleetDashboard } from "@/services/fleet/service";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requirePermission("admin:fleet:read");
  if (auth.error) return auth.error;

  const dashboard = await getFleetDashboard();
  return NextResponse.json(dashboard);
}
