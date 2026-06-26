import { NextResponse } from "next/server";
import { resolveTenantFromRequest } from "@/lib/tenant/resolve";
import { getTenantConfig } from "@/services/tenant/tenant.service";
import { DEFAULT_TENANT_SLUG } from "@/constants/tenant";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const tenant = await resolveTenantFromRequest(request);
  const slug = tenant?.slug ?? DEFAULT_TENANT_SLUG;
  const config = await getTenantConfig(slug);

  return NextResponse.json(config, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      "X-Tenant-Slug": slug,
    },
  });
}
