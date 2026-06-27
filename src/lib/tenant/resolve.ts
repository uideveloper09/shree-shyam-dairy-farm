import { prisma, isDatabaseConfigured } from "@/repositories/prisma";
import { DEFAULT_TENANT_SLUG, TENANT_COOKIE } from "@/constants/tenant";
import { resolveTenantFromHost } from "@/lib/tenant/resolve-host";

export { resolveTenantFromHost } from "@/lib/tenant/resolve-host";

export type ResolvedTenant = {
  id: string;
  slug: string;
  name: string;
  plan: string;
  farmId: string;
};

function parseCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

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
  const host = request.headers.get("host") || "";
  const subdomainSlug = resolveTenantFromHost(host);
  if (subdomainSlug) {
    const tenant = await resolveTenantBySlug(subdomainSlug);
    if (tenant) return tenant;
  }

  const custom = await resolveTenantByDomain(host);
  if (custom) return custom;

  const cookieSlug = parseCookie(request.headers.get("cookie"), TENANT_COOKIE);
  if (cookieSlug) {
    const tenant = await resolveTenantBySlug(cookieSlug);
    if (tenant) return tenant;
  }

  return resolveTenantBySlug(DEFAULT_TENANT_SLUG);
}
