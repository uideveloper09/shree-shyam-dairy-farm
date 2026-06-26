import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { getRetailDashboard } from "@/services/retail/service";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requirePermission("admin:retail:read");
  if (auth.error) return auth.error;
  return NextResponse.json(await getRetailDashboard());
}
