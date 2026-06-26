import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { getSaasDashboard } from "@/services/saas/service";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requirePermission("admin:saas:read");
  if (auth.error) return auth.error;
  return NextResponse.json(await getSaasDashboard());
}
