import { NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/auth/session";
import {
  createPartner,
  getPartnerPortal,
  linkPartnerTenant,
  listPartners,
} from "@/services/saas/service";
import type { SaasPartnerType } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireAnyPermission(["admin:saas:read", "partner:read", "reseller:read"]);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (id) {
    const portal = await getPartnerPortal(id);
    if (!portal) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(portal);
  }

  const type = searchParams.get("type") as SaasPartnerType | null;
  return NextResponse.json({ partners: await listPartners(type ?? undefined) });
}

export async function POST(request: Request) {
  const auth = await requireAnyPermission(["admin:saas:write"]);
  if (auth.error) return auth.error;

  const body = await request.json();

  if (body.action === "link" && body.partnerId && body.tenantId) {
    const link = await linkPartnerTenant(body.partnerId, body.tenantId, body.commissionRate);
    return NextResponse.json(link);
  }

  if (!body.name || !body.slug || !body.type) {
    return NextResponse.json({ error: "name, slug, type required" }, { status: 400 });
  }

  const partner = await createPartner(body);
  return NextResponse.json(partner, { status: 201 });
}
