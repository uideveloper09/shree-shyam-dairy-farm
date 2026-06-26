import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { createDriver, listDrivers } from "@/services/fleet/service";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requirePermission("fleet:read");
  if (auth.error) return auth.error;

  const drivers = await listDrivers();
  return NextResponse.json({ drivers });
}

export async function POST(request: Request) {
  const auth = await requirePermission("admin:fleet:write");
  if (auth.error) return auth.error;

  const body = await request.json();
  if (!body.userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const driver = await createDriver(undefined, body);
  return NextResponse.json(driver, { status: 201 });
}
