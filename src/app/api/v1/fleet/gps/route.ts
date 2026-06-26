import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import {
  getFleetGpsSnapshot,
  getVehicleGpsHistory,
  recordVehicleGps,
} from "@/services/fleet/service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requirePermission("fleet:read");
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const vehicleId = searchParams.get("vehicleId");

  if (vehicleId) {
    const history = await getVehicleGpsHistory(vehicleId);
    return NextResponse.json({ tracks: history });
  }

  const snapshot = await getFleetGpsSnapshot();
  return NextResponse.json({ vehicles: snapshot });
}

export async function POST(request: Request) {
  const auth = await requirePermission("fleet:write");
  if (auth.error) return auth.error;

  const body = await request.json();
  if (!body.vehicleId || body.latitude == null || body.longitude == null) {
    return NextResponse.json({ error: "vehicleId, latitude, longitude required" }, { status: 400 });
  }

  const track = await recordVehicleGps(body.vehicleId, body);
  return NextResponse.json(track, { status: 201 });
}
