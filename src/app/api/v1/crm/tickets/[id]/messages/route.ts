import { NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/auth/session";
import { addTicketMessage } from "@/services/crm/service";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAnyPermission(["crm:write", "crm:support", "admin:crm:write"]);
  if (auth.error) return auth.error;

  const { id } = await params;
  const body = await request.json();
  if (!body.body) return NextResponse.json({ error: "body required" }, { status: 400 });

  const isStaff = auth.user!.role !== "CUSTOMER";
  const message = await addTicketMessage(
    id,
    auth.user!.id,
    body.body,
    isStaff ? body.isInternal : false
  );
  return NextResponse.json(message, { status: 201 });
}
