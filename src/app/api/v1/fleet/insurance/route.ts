import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { createInsurance, listInsurance } from "@/services/fleet/service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requirePermission("fleet:read");
  if (auth.error) return auth.error;

  const vehicleId = new URL(request.url).searchParams.get("vehicleId") ?? undefined;
  const policies = await listInsurance(vehicleId);
  return NextResponse.json({ insurance: policies });
}

export async function POST(request: Request) {
  const auth = await requirePermission("admin:fleet:write");
  if (auth.error) return auth.error;

  const body = await request.json();
  if (!body.vehicleId || !body.provider || !body.policyNo || !body.startDate || !body.endDate) {
    return NextResponse.json(
      { error: "vehicleId, provider, policyNo, startDate, endDate required" },
      { status: 400 }
    );
  }

  const policy = await createInsurance(body);
  return NextResponse.json(policy, { status: 201 });
}
