import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { createRoute, listRoutes } from "@/services/fleet/service";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requirePermission("fleet:read");
  if (auth.error) return auth.error;

  const routes = await listRoutes();
  return NextResponse.json({ routes });
}

export async function POST(request: Request) {
  const auth = await requirePermission("admin:fleet:write");
  if (auth.error) return auth.error;

  const body = await request.json();
  if (!body.name || !body.stops?.length) {
    return NextResponse.json({ error: "name and stops required" }, { status: 400 });
  }

  const route = await createRoute(undefined, body);
  return NextResponse.json(route, { status: 201 });
}
