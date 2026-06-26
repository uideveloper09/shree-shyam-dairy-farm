import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { listOfflineQueue, queueOfflineBill, syncOfflineBills } from "@/services/retail/service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requirePermission("retail:read");
  if (auth.error) return auth.error;

  const status = new URL(request.url).searchParams.get("status") ?? undefined;
  return NextResponse.json({ queue: await listOfflineQueue(status) });
}

export async function POST(request: Request) {
  const auth = await requirePermission("retail:write");
  if (auth.error) return auth.error;

  const body = await request.json();

  if (body.action === "sync") {
    const result = await syncOfflineBills(auth.user!.id);
    return NextResponse.json(result);
  }

  if (!body.clientId || !body.payload) {
    return NextResponse.json({ error: "clientId and payload required" }, { status: 400 });
  }

  const row = await queueOfflineBill(body);
  return NextResponse.json(row, { status: 201 });
}
