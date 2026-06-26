import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { createCustomer, listCustomers } from "@/services/crm/service";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requirePermission("crm:read");
  if (auth.error) return auth.error;

  const customers = await listCustomers();
  return NextResponse.json({ customers });
}

export async function POST(request: Request) {
  const auth = await requirePermission("crm:write");
  if (auth.error) return auth.error;

  const body = await request.json();
  if (!body.name) return NextResponse.json({ error: "name required" }, { status: 400 });

  const customer = await createCustomer(undefined, { ...body, ownerId: auth.user!.id });
  return NextResponse.json(customer, { status: 201 });
}
