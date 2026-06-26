import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { getTenantBilling } from "@/services/saas/service";
import { resolveTenantFromRequest } from "@/lib/tenant/resolve";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requirePermission("saas:read");
  if (auth.error) return auth.error;

  const tenant = await resolveTenantFromRequest(request);
  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  return NextResponse.json(await getTenantBilling(tenant.id));
}
