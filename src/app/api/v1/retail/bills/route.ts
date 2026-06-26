import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { createBill, listBills, voidBill } from "@/services/retail/service";
import type { PosBillStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requirePermission("retail:read");
  if (auth.error) return auth.error;

  const status = new URL(request.url).searchParams.get("status") as PosBillStatus | null;
  return NextResponse.json({ bills: await listBills(undefined, status ?? undefined) });
}

export async function POST(request: Request) {
  const auth = await requirePermission("retail:write");
  if (auth.error) return auth.error;

  const body = await request.json();

  if (body.action === "void" && body.id) {
    const bill = await voidBill(body.id);
    return NextResponse.json(bill);
  }

  if (!body.lines?.length || !body.payments?.length) {
    return NextResponse.json({ error: "lines and payments required" }, { status: 400 });
  }

  try {
    const bill = await createBill(undefined, auth.user!.id, body);
    return NextResponse.json(bill, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
