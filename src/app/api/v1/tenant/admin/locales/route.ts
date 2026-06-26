import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { resolveTenantFromRequest } from "@/lib/tenant/resolve";
import { updateTenantLocales } from "@/services/tenant/tenant.service";
import { assertTenantMember } from "@/lib/tenant/isolation";
import { SUPPORTED_LOCALES } from "@/constants/tenant";

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
  const defaultLocale = String(body.defaultLocale || "en");
  const enabledLocales = (Array.isArray(body.enabledLocales) ? body.enabledLocales : ["en"]).map(
    String
  );
  const valid = enabledLocales.filter((l: string) =>
    (SUPPORTED_LOCALES as readonly string[]).includes(l)
  );

  const locales = await updateTenantLocales(
    tenant.id,
    defaultLocale,
    valid.length ? valid : ["en"]
  );
  return NextResponse.json({ locales });
}
