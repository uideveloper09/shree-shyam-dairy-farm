import { NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/auth/session";
import { getTicket, updateTicket } from "@/services/crm/service";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAnyPermission(["crm:read", "crm:support", "admin:crm:read"]);
  if (auth.error) return auth.error;

  const { id } = await params;
  const ticket = await getTicket(id);
  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(ticket);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAnyPermission(["crm:write", "admin:crm:write"]);
  if (auth.error) return auth.error;

  const { id } = await params;
  const body = await request.json();
  const ticket = await updateTicket(id, body);
  return NextResponse.json(ticket);
}
