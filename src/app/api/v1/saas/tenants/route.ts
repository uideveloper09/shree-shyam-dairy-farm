import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { getTenantWhiteLabel, listTenants } from "@/services/saas/service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requirePermission("admin:saas:read");
  if (auth.error) return auth.error;

  const id = new URL(request.url).searchParams.get("id");
  if (id) {
    const tenant = await getTenantWhiteLabel(id);
    if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(tenant);
  }

  return NextResponse.json({ tenants: await listTenants() });
}
