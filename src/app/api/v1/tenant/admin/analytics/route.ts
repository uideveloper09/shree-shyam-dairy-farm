import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { resolveTenantFromRequest } from "@/lib/tenant/resolve";
import { getTenantAnalytics } from "@/services/tenant/tenant.service";
import { assertTenantMember } from "@/lib/tenant/isolation";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const tenant = await resolveTenantFromRequest(request);
  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const allowed =
    (await assertTenantMember(tenant.id, auth.user!.id, ["owner", "admin", "member"])) ||
    ["OWNER", "ADMIN", "FARM_MANAGER"].includes(auth.user!.role);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(request.url);
  const days = Number(url.searchParams.get("days") || 30);
  const analytics = await getTenantAnalytics(tenant.id, days);

  return NextResponse.json({ tenant: { slug: tenant.slug, plan: tenant.plan }, ...analytics });
}
