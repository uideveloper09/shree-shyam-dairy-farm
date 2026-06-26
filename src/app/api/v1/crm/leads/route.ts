import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { createLead, listLeads } from "@/services/crm/service";
import type { CrmLeadStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requirePermission("crm:read");
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as CrmLeadStatus | null;
  const leads = await listLeads(undefined, status ?? undefined);
  return NextResponse.json({ leads });
}

export async function POST(request: Request) {
  const auth = await requirePermission("crm:write");
  if (auth.error) return auth.error;

  const body = await request.json();
  if (!body.name) return NextResponse.json({ error: "name required" }, { status: 400 });

  const lead = await createLead(undefined, auth.user!.id, body);
  return NextResponse.json(lead, { status: 201 });
}
