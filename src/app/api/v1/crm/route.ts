import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { getCrmDashboard } from "@/services/crm/service";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requirePermission("admin:crm:read");
  if (auth.error) return auth.error;

  const dashboard = await getCrmDashboard();
  return NextResponse.json(dashboard);
}
