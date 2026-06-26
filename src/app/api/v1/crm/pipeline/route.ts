import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { getPipelineBoard } from "@/services/crm/service";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requirePermission("crm:read");
  if (auth.error) return auth.error;

  const board = await getPipelineBoard();
  return NextResponse.json(board);
}
