import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { createQuotation, listQuotations, updateQuotationStatus } from "@/services/crm/service";
import type { CrmQuotationStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requirePermission("crm:read");
  if (auth.error) return auth.error;

  const quotations = await listQuotations();
  return NextResponse.json({ quotations });
}

export async function POST(request: Request) {
  const auth = await requirePermission("crm:write");
  if (auth.error) return auth.error;

  const body = await request.json();
  if (!body.lines?.length) {
    return NextResponse.json({ error: "lines required" }, { status: 400 });
  }

  const quotation = await createQuotation(undefined, auth.user!.id, body);
  return NextResponse.json(quotation, { status: 201 });
}

export async function PATCH(request: Request) {
  const auth = await requirePermission("crm:write");
  if (auth.error) return auth.error;

  const body = await request.json();
  if (!body.id || !body.status) {
    return NextResponse.json({ error: "id and status required" }, { status: 400 });
  }

  const quotation = await updateQuotationStatus(body.id, body.status as CrmQuotationStatus);
  return NextResponse.json(quotation);
}
