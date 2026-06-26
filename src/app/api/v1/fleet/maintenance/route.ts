import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { completeMaintenance, createMaintenance, listMaintenance } from "@/services/fleet/service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requirePermission("fleet:read");
  if (auth.error) return auth.error;

  const vehicleId = new URL(request.url).searchParams.get("vehicleId") ?? undefined;
  const records = await listMaintenance(vehicleId);
  return NextResponse.json({ maintenance: records });
}

export async function POST(request: Request) {
  const auth = await requirePermission("fleet:write");
  if (auth.error) return auth.error;

  const body = await request.json();
  if (!body.vehicleId || !body.title) {
    return NextResponse.json({ error: "vehicleId and title required" }, { status: 400 });
  }

  if (body.action === "complete" && body.id) {
    const record = await completeMaintenance(body.id, body.cost);
    return NextResponse.json(record);
  }

  const record = await createMaintenance(body);
  return NextResponse.json(record, { status: 201 });
}
