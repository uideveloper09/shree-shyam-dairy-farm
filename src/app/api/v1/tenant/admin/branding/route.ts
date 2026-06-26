import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { resolveTenantFromRequest } from "@/lib/tenant/resolve";
import { updateTenantBranding } from "@/services/tenant/tenant.service";
import { assertTenantMember } from "@/lib/tenant/isolation";
import { prisma } from "@/repositories/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const tenant = await resolveTenantFromRequest(request);
  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const isOwner = await assertTenantMember(tenant.id, auth.user!.id, ["owner", "admin"]);
  const isPlatformAdmin = ["OWNER", "ADMIN"].includes(auth.user!.role);
  if (!isOwner && !isPlatformAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (isPlatformAdmin && !isOwner) {
    await prisma.tenantMember.upsert({
      where: { tenantId_userId: { tenantId: tenant.id, userId: auth.user!.id } },
      create: { tenantId: tenant.id, userId: auth.user!.id, role: "owner" },
      update: {},
    });
  }

  const body = await request.json();
  const branding = await updateTenantBranding(tenant.id, {
    logoUrl: body.logoUrl,
    faviconUrl: body.faviconUrl,
    companyName: body.companyName,
    tagline: body.tagline,
    supportEmail: body.supportEmail,
  });

  return NextResponse.json({ branding });
}
