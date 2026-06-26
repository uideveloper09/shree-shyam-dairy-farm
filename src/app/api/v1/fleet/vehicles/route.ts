import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { createVehicle, listVehicles } from "@/services/fleet/service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requirePermission("fleet:read");
  if (auth.error) return auth.error;

  const tankers = new URL(request.url).searchParams.get("tankers") === "1";
  const vehicles = await listVehicles(undefined, tankers);
  return NextResponse.json({ vehicles });
}

export async function POST(request: Request) {
  const auth = await requirePermission("admin:fleet:write");
  if (auth.error) return auth.error;

  const body = await request.json();
  if (!body.registrationNo || !body.name) {
    return NextResponse.json({ error: "registrationNo and name required" }, { status: 400 });
  }

  const vehicle = await createVehicle(undefined, body);
  return NextResponse.json(vehicle, { status: 201 });
}
