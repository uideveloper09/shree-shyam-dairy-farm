import { NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/auth/session";
import { createTicket, listTickets } from "@/services/crm/service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireAnyPermission(["crm:read", "crm:support", "admin:crm:read"]);
  if (auth.error) return auth.error;

  const isStaff = auth.user!.role !== "CUSTOMER";
  const tickets = await listTickets(undefined, isStaff ? undefined : auth.user!.id);
  return NextResponse.json({ tickets });
}

export async function POST(request: Request) {
  const auth = await requireAnyPermission(["crm:write", "crm:support", "admin:crm:write"]);
  if (auth.error) return auth.error;

  const body = await request.json();
  if (!body.subject) return NextResponse.json({ error: "subject required" }, { status: 400 });

  const ticket = await createTicket(undefined, auth.user!.id, body);
  return NextResponse.json(ticket, { status: 201 });
}
