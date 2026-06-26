import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { convertLeadToCustomer } from "@/services/crm/service";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission("crm:write");
  if (auth.error) return auth.error;

  const { id } = await params;
  try {
    const customer = await convertLeadToCustomer(id, auth.user!.id);
    return NextResponse.json(customer);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
