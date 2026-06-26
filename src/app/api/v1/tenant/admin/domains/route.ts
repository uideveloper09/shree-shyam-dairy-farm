import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { resolveTenantFromRequest } from "@/lib/tenant/resolve";
import { addTenantDomain } from "@/services/tenant/tenant.service";
import { assertTenantMember } from "@/lib/tenant/isolation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const tenant = await resolveTenantFromRequest(request);
  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const allowed =
    (await assertTenantMember(tenant.id, auth.user!.id, ["owner", "admin"])) ||
    ["OWNER", "ADMIN"].includes(auth.user!.role);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const domain = typeof body.domain === "string" ? body.domain.trim().toLowerCase() : "";
  if (!domain) return NextResponse.json({ error: "Domain required" }, { status: 400 });

  try {
    new URL(`https://${domain}`);
  } catch {
    return NextResponse.json({ error: "Invalid domain" }, { status: 400 });
  }

  const record = await addTenantDomain(tenant.id, domain);
  return NextResponse.json({
    domain: record,
    verifyInstructions: `Add TXT record: _ssd-verify.${domain} = ${record.verifyToken}`,
  });
}
