import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { getPendingApprovals } from "@/modules/workflows/engine";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requirePermission("workflows:approve");
  if (auth.error) return auth.error;

  const pending = await getPendingApprovals(auth.user!.id, auth.user!.role);
  return NextResponse.json({ pending });
}
