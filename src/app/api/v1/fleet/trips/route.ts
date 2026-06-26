import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { createTrip, listTrips, updateTripStatus } from "@/services/fleet/service";
import type { FleetTripStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requirePermission("fleet:read");
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const trips = await listTrips(
    searchParams.get("vehicleId") ?? undefined,
    searchParams.get("driverId") ?? undefined
  );
  return NextResponse.json({ trips });
}

export async function POST(request: Request) {
  const auth = await requirePermission("fleet:write");
  if (auth.error) return auth.error;

  const body = await request.json();

  if (body.id && body.status) {
    const trip = await updateTripStatus(body.id, body.status as FleetTripStatus, body);
    return NextResponse.json(trip);
  }

  if (!body.vehicleId) {
    return NextResponse.json({ error: "vehicleId required" }, { status: 400 });
  }

  const trip = await createTrip({
    ...body,
    driverUserId: body.driverUserId ?? auth.user!.id,
  });
  return NextResponse.json(trip, { status: 201 });
}
