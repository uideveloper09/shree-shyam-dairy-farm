import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { createPackaging, listPackaging } from "@/services/processing/service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requirePermission("processing:read");
  if (auth.error) return auth.error;

  const batchId = new URL(request.url).searchParams.get("batchId") ?? undefined;
  const packaging = await listPackaging(batchId);
  return NextResponse.json({ packaging });
}

export async function POST(request: Request) {
  const auth = await requirePermission("processing:write");
  if (auth.error) return auth.error;

  const body = await request.json();
  if (!body.batchId || body.totalQty == null) {
    return NextResponse.json({ error: "batchId and totalQty required" }, { status: 400 });
  }

  try {
    const record = await createPackaging(body);
    return NextResponse.json(record, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
