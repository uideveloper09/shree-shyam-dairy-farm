import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { listFuelLogs, logFuel } from "@/services/fleet/service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requirePermission("fleet:read");
  if (auth.error) return auth.error;

  const vehicleId = new URL(request.url).searchParams.get("vehicleId") ?? undefined;
  const logs = await listFuelLogs(vehicleId);
  return NextResponse.json({ logs });
}

export async function POST(request: Request) {
  const auth = await requirePermission("fleet:write");
  if (auth.error) return auth.error;

  const body = await request.json();
  if (!body.vehicleId || body.liters == null || body.cost == null) {
    return NextResponse.json({ error: "vehicleId, liters, cost required" }, { status: 400 });
  }

  const log = await logFuel(body);
  return NextResponse.json(log, { status: 201 });
}
