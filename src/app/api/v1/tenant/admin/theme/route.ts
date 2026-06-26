import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { resolveTenantFromRequest } from "@/lib/tenant/resolve";
import { updateTenantTheme } from "@/services/tenant/tenant.service";
import { assertTenantMember } from "@/lib/tenant/isolation";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const tenant = await resolveTenantFromRequest(request);
  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const allowed =
    (await assertTenantMember(tenant.id, auth.user!.id, ["owner", "admin"])) ||
    ["OWNER", "ADMIN"].includes(auth.user!.role);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const theme = await updateTenantTheme(tenant.id, body);
  return NextResponse.json({ theme });
}
