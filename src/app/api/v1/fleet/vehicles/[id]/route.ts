import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { updateVehicle } from "@/services/fleet/service";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission("admin:fleet:write");
  if (auth.error) return auth.error;

  const { id } = await params;
  const body = await request.json();
  const vehicle = await updateVehicle(id, body);
  return NextResponse.json(vehicle);
}
