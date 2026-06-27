import { prisma, isDatabaseConfigured } from "@/repositories/prisma";
import { DEFAULT_TENANT_SLUG } from "@/constants/tenant";
import { resolveTenantFromHost } from "@/lib/tenant/resolve-host";

export { resolveTenantFromHost } from "@/lib/tenant/resolve-host";

export type ResolvedTenant = {
  id: string;
  slug: string;
  name: string;
  plan: string;
  farmId: string;
};

export async function resolveTenantBySlug(slug: string): Promise<ResolvedTenant | null> {
  if (!isDatabaseConfigured()) {
    if (slug === DEFAULT_TENANT_SLUG) {
      return {
        id: "default",
        slug: DEFAULT_TENANT_SLUG,
        name: "Shree Shyam Dairy Farm",
        plan: "enterprise",
        farmId: DEFAULT_TENANT_SLUG,
      };
    }
    return null;
  }

  const tenant = await prisma.tenant.findFirst({
    where: { slug, isActive: true },
    select: { id: true, slug: true, name: true, plan: true },
  });

  if (!tenant) return null;
  return { ...tenant, farmId: tenant.slug };
}

export async function resolveTenantByDomain(host: string): Promise<ResolvedTenant | null> {
  if (!isDatabaseConfigured()) return null;

  const normalized = host.toLowerCase().split(":")[0]!;
  const domain = await prisma.tenantDomain.findFirst({
    where: { domain: normalized, verifiedAt: { not: null } },
    include: {
      tenant: { select: { id: true, slug: true, name: true, plan: true, isActive: true } },
    },
  });

  if (!domain?.tenant.isActive) return null;
  return {
    id: domain.tenant.id,
    slug: domain.tenant.slug,
    name: domain.tenant.name,
    plan: domain.tenant.plan,
    farmId: domain.tenant.slug,
  };
}

export async function resolveTenantFromRequest(request: Request): Promise<ResolvedTenant | null> {
  const headerSlug = request.headers.get("x-tenant-slug");
  if (headerSlug) return resolveTenantBySlug(headerSlug);

  const host = request.headers.get("host") || "";
  const subdomainSlug = resolveTenantFromHost(host);
  if (subdomainSlug) return resolveTenantBySlug(subdomainSlug);

  const custom = await resolveTenantByDomain(host);
  if (custom) return custom;

  return resolveTenantBySlug(DEFAULT_TENANT_SLUG);
}
