import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { createBatch, listBatches, updateBatchStatus } from "@/services/processing/service";
import type { ProcBatchStatus, ProcProductType } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requirePermission("processing:read");
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const batches = await listBatches(
    undefined,
    (searchParams.get("productType") as ProcProductType) || undefined,
    (searchParams.get("status") as ProcBatchStatus) || undefined
  );
  return NextResponse.json({ batches });
}

export async function POST(request: Request) {
  const auth = await requirePermission("processing:write");
  if (auth.error) return auth.error;

  const body = await request.json();
  if (!body.productType) {
    return NextResponse.json({ error: "productType required" }, { status: 400 });
  }

  const batch = await createBatch(undefined, auth.user!.id, body);
  return NextResponse.json(batch, { status: 201 });
}

export async function PATCH(request: Request) {
  const auth = await requirePermission("processing:write");
  if (auth.error) return auth.error;

  const body = await request.json();
  if (!body.id || !body.status) {
    return NextResponse.json({ error: "id and status required" }, { status: 400 });
  }

  const batch = await updateBatchStatus(body.id, body.status, body);
  return NextResponse.json(batch);
}
