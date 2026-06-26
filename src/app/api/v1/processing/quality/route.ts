import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import {
  finalizeBatchQc,
  listQualityChecks,
  recordQualityCheck,
} from "@/services/processing/service";
import type { ProcQcStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requirePermission("processing:read");
  if (auth.error) return auth.error;

  const batchId = new URL(request.url).searchParams.get("batchId") ?? undefined;
  const checks = await listQualityChecks(batchId);
  return NextResponse.json({ checks });
}

export async function POST(request: Request) {
  const auth = await requirePermission("processing:write");
  if (auth.error) return auth.error;

  const body = await request.json();

  if (body.action === "finalize" && body.batchId) {
    const result = await finalizeBatchQc(body.batchId);
    return NextResponse.json(result);
  }

  if (!body.id || !body.actualValue || !body.status) {
    return NextResponse.json({ error: "id, actualValue, status required" }, { status: 400 });
  }

  const check = await recordQualityCheck(body.id, auth.user!.id, {
    actualValue: body.actualValue,
    status: body.status as ProcQcStatus,
    notes: body.notes,
  });
  return NextResponse.json(check);
}
