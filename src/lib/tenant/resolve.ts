import { prisma, isDatabaseConfigured } from "@/repositories/prisma";
import { DEFAULT_TENANT_SLUG } from "@/constants/tenant";

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

export function resolveTenantFromHost(host: string): string | null {
  const base = (
    process.env.NEXT_PUBLIC_APP_DOMAIN || "shree-shyam-dairy-farm.vercel.app"
  ).toLowerCase();
  const h = host.toLowerCase().split(":")[0]!;

  if (h === base || h === "localhost") return DEFAULT_TENANT_SLUG;

  if (h.endsWith(`.${base}`)) {
    const sub = h.replace(`.${base}`, "");
    if (sub && sub !== "www") return sub;
  }

  return null;
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
