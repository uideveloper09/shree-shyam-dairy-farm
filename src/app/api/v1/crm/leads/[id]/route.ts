import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { updateLead } from "@/services/crm/service";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission("crm:write");
  if (auth.error) return auth.error;

  const { id } = await params;
  const body = await request.json();
  const lead = await updateLead(id, body);
  return NextResponse.json(lead);
}
