import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { createReturn, listReturns } from "@/services/retail/service";
import type { PosReturnType } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requirePermission("retail:read");
  if (auth.error) return auth.error;
  return NextResponse.json({ returns: await listReturns() });
}

export async function POST(request: Request) {
  const auth = await requirePermission("retail:write");
  if (auth.error) return auth.error;

  const body = await request.json();
  if (!body.originalBillId || !body.type || !body.items?.length) {
    return NextResponse.json({ error: "originalBillId, type, items required" }, { status: 400 });
  }

  try {
    const ret = await createReturn(auth.user!.id, {
      ...body,
      type: body.type as PosReturnType,
    });
    return NextResponse.json(ret, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
