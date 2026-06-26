import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import {
  createShippingZone,
  createTaxRule,
  getRegionalSettings,
  listShippingZones,
  listTaxRules,
  seedDefaultTaxRules,
  updateRegionalSettings,
} from "@/services/saas/service";
import { resolveTenantFromRequest } from "@/lib/tenant/resolve";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requirePermission("saas:read");
  if (auth.error) return auth.error;

  const tenant = await resolveTenantFromRequest(request);
  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const { searchParams } = new URL(request.url);
  const section = searchParams.get("section");

  if (section === "tax") return NextResponse.json({ rules: await listTaxRules(tenant.id) });
  if (section === "shipping") {
    return NextResponse.json({ zones: await listShippingZones(tenant.id) });
  }

  return NextResponse.json({ regional: await getRegionalSettings(tenant.id) });
}

export async function POST(request: Request) {
  const auth = await requirePermission("saas:write");
  if (auth.error) return auth.error;

  const tenant = await resolveTenantFromRequest(request);
  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const body = await request.json();

  if (body.action === "seed-tax") {
    return NextResponse.json(await seedDefaultTaxRules(tenant.id));
  }

  if (body.section === "regional") {
    const regional = await updateRegionalSettings(tenant.id, body);
    return NextResponse.json(regional);
  }

  if (body.section === "tax") {
    const rule = await createTaxRule(tenant.id, body);
    return NextResponse.json(rule, { status: 201 });
  }

  if (body.section === "shipping") {
    const zone = await createShippingZone(tenant.id, body);
    return NextResponse.json(zone, { status: 201 });
  }

  return NextResponse.json({ error: "Invalid section" }, { status: 400 });
}
