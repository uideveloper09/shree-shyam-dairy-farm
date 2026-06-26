import { prisma } from "@/repositories/prisma";
import { DEFAULT_TENANT_SLUG } from "@/constants/tenant";
import type { ResolvedTenant } from "@/lib/tenant/resolve";

/** Scope queries to tenant — maps tenant.slug → farmId for farm modules */
export function tenantFarmId(tenant: ResolvedTenant): string {
  return tenant.farmId || tenant.slug || DEFAULT_TENANT_SLUG;
}

export function withTenantScope<T extends Record<string, unknown>>(
  tenant: ResolvedTenant,
  where: T = {} as T
): T & { farmId?: string } {
  return { ...where, farmId: tenantFarmId(tenant) };
}

export async function ensureDefaultTenant() {
  return prisma.tenant.upsert({
    where: { slug: DEFAULT_TENANT_SLUG },
    create: {
      slug: DEFAULT_TENANT_SLUG,
      name: "Shree Shyam Dairy Farm",
      plan: "enterprise",
      branding: {
        create: {
          companyName: "Shree Shyam Dairy Farm",
          tagline: "Pure & Fresh Dairy Products",
        },
      },
      theme: { create: {} },
      localeConfig: { create: { defaultLocale: "en", enabledLocales: ["en", "hi"] } },
      subscription: {
        create: { plan: "enterprise", status: "active", billingProvider: "razorpay" },
      },
    },
    update: {},
    include: {
      branding: true,
      theme: true,
      localeConfig: true,
      subscription: true,
      domains: true,
    },
  });
}

export async function assertTenantMember(tenantId: string, userId: string, roles?: string[]) {
  const member = await prisma.tenantMember.findUnique({
    where: { tenantId_userId: { tenantId, userId } },
  });
  if (!member) return false;
  if (roles?.length && !roles.includes(member.role)) return false;
  return true;
}
