import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { installListing, listMarketplace, listTenantInstalls } from "@/services/saas/service";
import type { SaasListingType } from "@prisma/client";
import { resolveTenantFromRequest } from "@/lib/tenant/resolve";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requirePermission("saas:read");
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") as SaasListingType | null;
  const installed = searchParams.get("installed") === "1";

  if (installed) {
    const tenant = await resolveTenantFromRequest(request);
    if (!tenant) return NextResponse.json({ installs: [] });
    return NextResponse.json({ installs: await listTenantInstalls(tenant.id) });
  }

  return NextResponse.json({
    listings: await listMarketplace(type ?? undefined, searchParams.get("category") ?? undefined),
  });
}

export async function POST(request: Request) {
  const auth = await requirePermission("saas:write");
  if (auth.error) return auth.error;

  const tenant = await resolveTenantFromRequest(request);
  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const body = await request.json();
  if (!body.listingId) return NextResponse.json({ error: "listingId required" }, { status: 400 });

  const install = await installListing(tenant.id, body.listingId);
  return NextResponse.json(install, { status: 201 });
}
