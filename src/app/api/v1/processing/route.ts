import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { getProcessingDashboard } from "@/services/processing/service";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requirePermission("admin:processing:read");
  if (auth.error) return auth.error;

  return NextResponse.json(await getProcessingDashboard());
}
