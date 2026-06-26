import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { resolveTenantFromRequest } from "@/lib/tenant/resolve";
import { getUsageSummary } from "@/lib/tenant/usage";
import { TENANT_PLANS } from "@/constants/tenant";
import { assertTenantMember } from "@/lib/tenant/isolation";
import type { TenantPlan } from "@/constants/tenant";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const tenant = await resolveTenantFromRequest(request);
  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const allowed =
    (await assertTenantMember(tenant.id, auth.user!.id)) ||
    ["OWNER", "ADMIN"].includes(auth.user!.role);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const since = new Date();
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const usage = await getUsageSummary(tenant.id, since);
  const plan = TENANT_PLANS[tenant.plan as TenantPlan] ?? TENANT_PLANS.starter;

  return NextResponse.json({
    usage,
    limits: plan.limits,
    plan: tenant.plan,
    periodStart: since.toISOString(),
  });
}
