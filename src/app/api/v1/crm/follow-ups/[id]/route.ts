import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { completeFollowUp } from "@/services/crm/service";

export const dynamic = "force-dynamic";

export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission("crm:write");
  if (auth.error) return auth.error;

  const { id } = await params;
  const followUp = await completeFollowUp(id);
  return NextResponse.json(followUp);
}
