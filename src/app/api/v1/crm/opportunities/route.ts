import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { createOpportunity, listOpportunities } from "@/services/crm/service";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requirePermission("crm:read");
  if (auth.error) return auth.error;

  const opportunities = await listOpportunities();
  return NextResponse.json({ opportunities });
}

export async function POST(request: Request) {
  const auth = await requirePermission("crm:write");
  if (auth.error) return auth.error;

  const body = await request.json();
  if (!body.title) return NextResponse.json({ error: "title required" }, { status: 400 });

  const opportunity = await createOpportunity(undefined, auth.user!.id, body);
  return NextResponse.json(opportunity, { status: 201 });
}
