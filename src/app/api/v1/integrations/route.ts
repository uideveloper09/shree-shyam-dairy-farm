import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { getIntegrationsDashboard } from "@/services/integrations/service";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requirePermission("admin:integrations:read");
  if (auth.error) return auth.error;

  const dashboard = await getIntegrationsDashboard();
  return NextResponse.json(dashboard);
}
