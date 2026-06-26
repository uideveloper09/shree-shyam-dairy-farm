import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { getAiPlatformDashboard } from "@/services/ai-platform/service";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requirePermission("admin:ai:read");
  if (auth.error) return auth.error;
  return NextResponse.json(await getAiPlatformDashboard());
}
