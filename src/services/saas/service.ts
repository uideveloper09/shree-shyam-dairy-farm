import { prisma } from "@/repositories/prisma";
import { TENANT_PLANS, GLOBAL_TAX_TEMPLATES } from "@/constants/tenant";
import { getUsageSummary } from "@/lib/tenant/usage";
import type { SaasListingType, SaasPartnerType } from "@prisma/client";

export async function getSaasDashboard(tenantId?: string) {
  const [
    tenantCount,
    marketplaceListings,
    apiListings,
    installs,
    partners,
    resellers,
    subscriptions,
  ] = await Promise.all([
    prisma.tenant.count({ where: { isActive: true } }),
    prisma.saasMarketplaceListing.count({
      where: { isPublished: true, type: { in: ["APP", "PLUGIN"] } },
    }),
    prisma.saasMarketplaceListing.count({ where: { isPublished: true, type: "API" } }),
    tenantId
      ? prisma.saasMarketplaceInstall.count({ where: { tenantId } })
      : prisma.saasMarketplaceInstall.count(),
    prisma.saasPartner.count({ where: { type: "PARTNER", isActive: true } }),
    prisma.saasPartner.count({ where: { type: "RESELLER", isActive: true } }),
    prisma.tenantBillingSubscription.count({ where: { status: "active" } }),
  ]);

  return {
    stats: {
      tenants: tenantCount,
      appStoreItems: marketplaceListings,
      apiMarketplaceItems: apiListings,
      installs,
      partners,
      resellers,
      activeSubscriptions: subscriptions,
    },
  };
}

// ─── Multi Tenant / White Label ──────────────────────────────────────────────

export async function listTenants() {
  return prisma.tenant.findMany({
    where: { isActive: true },
    include: {
      branding: true,
      theme: true,
      subscription: true,
      regionalSettings: true,
      _count: { select: { members: true, marketplaceInstalls: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getTenantWhiteLabel(tenantId: string) {
  return prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { branding: true, theme: true, domains: true, regionalSettings: true },
  });
}

// ─── Marketplace / App Store / API Marketplace ─────────────────────────────────

export async function listMarketplace(type?: SaasListingType, category?: string) {
  return prisma.saasMarketplaceListing.findMany({
    where: {
      isPublished: true,
      ...(type ? { type } : {}),
      ...(category ? { category } : {}),
    },
    include: { _count: { select: { installs: true } } },
    orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
  });
}

export async function installListing(tenantId: string, listingId: string) {
  return prisma.saasMarketplaceInstall.upsert({
    where: { tenantId_listingId: { tenantId, listingId } },
    create: { tenantId, listingId },
    update: { status: "active", installedAt: new Date() },
    include: { listing: true },
  });
}

export async function listTenantInstalls(tenantId: string) {
  return prisma.saasMarketplaceInstall.findMany({
    where: { tenantId },
    include: { listing: true },
    orderBy: { installedAt: "desc" },
  });
}

// ─── Billing & Subscriptions ─────────────────────────────────────────────────

export async function getTenantBilling(tenantId: string) {
  const [tenant, subscription, usage] = await Promise.all([
    prisma.tenant.findUnique({ where: { id: tenantId }, select: { plan: true, name: true } }),
    prisma.tenantBillingSubscription.findUnique({ where: { tenantId } }),
    getUsageSummary(tenantId, new Date(new Date().setDate(1))),
  ]);

  const plan = tenant?.plan ?? "starter";
  const planConfig = TENANT_PLANS[plan as keyof typeof TENANT_PLANS] ?? TENANT_PLANS.starter;

  return { tenant, subscription, usage, planConfig };
}

// ─── Partners & Resellers ────────────────────────────────────────────────────

export async function listPartners(type?: SaasPartnerType) {
  return prisma.saasPartner.findMany({
    where: { isActive: true, ...(type ? { type } : {}) },
    include: {
      _count: { select: { tenants: true, members: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getPartnerPortal(partnerId: string) {
  return prisma.saasPartner.findUnique({
    where: { id: partnerId },
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true } } } },
      tenants: {
        include: {
          tenant: {
            select: { id: true, name: true, slug: true, plan: true, subscription: true },
          },
        },
      },
    },
  });
}

export async function createPartner(data: {
  type: SaasPartnerType;
  name: string;
  slug: string;
  email?: string;
  commissionRate?: number;
}) {
  return prisma.saasPartner.create({ data });
}

export async function linkPartnerTenant(
  partnerId: string,
  tenantId: string,
  commissionRate?: number
) {
  return prisma.saasPartnerTenant.upsert({
    where: { partnerId_tenantId: { partnerId, tenantId } },
    create: { partnerId, tenantId, commissionRate },
    update: { commissionRate },
  });
}

// ─── Multi Language / Currency / Country ─────────────────────────────────────

export async function getRegionalSettings(tenantId: string) {
  return prisma.tenantRegionalSettings.findUnique({ where: { tenantId } });
}

export async function updateRegionalSettings(
  tenantId: string,
  data: {
    defaultCurrency?: string;
    enabledCurrencies?: string[];
    defaultCountry?: string;
    enabledCountries?: string[];
    defaultLocale?: string;
    enabledLocales?: string[];
    timezone?: string;
  }
) {
  return prisma.tenantRegionalSettings.upsert({
    where: { tenantId },
    create: { tenantId, ...data },
    update: data,
  });
}

// ─── Global Tax ──────────────────────────────────────────────────────────────

export async function listTaxRules(tenantId: string) {
  return prisma.tenantTaxRule.findMany({
    where: { tenantId, isActive: true },
    orderBy: { countryCode: "asc" },
  });
}

export async function seedDefaultTaxRules(tenantId: string) {
  const existing = await prisma.tenantTaxRule.count({ where: { tenantId } });
  if (existing > 0) return { seeded: 0 };

  const rules = Object.entries(GLOBAL_TAX_TEMPLATES).map(([countryCode, t]) => ({
    tenantId,
    countryCode,
    taxName: t.name,
    taxType: t.type,
    rate: t.rate,
    hsnCode: "hsn" in t ? t.hsn : undefined,
  }));

  await prisma.tenantTaxRule.createMany({ data: rules });
  return { seeded: rules.length };
}

export async function createTaxRule(
  tenantId: string,
  data: {
    countryCode: string;
    taxName: string;
    taxType?: string;
    rate: number;
    hsnCode?: string;
    isInclusive?: boolean;
  }
) {
  return prisma.tenantTaxRule.create({ data: { tenantId, ...data } });
}

// ─── Global Shipping ─────────────────────────────────────────────────────────

export async function listShippingZones(tenantId: string) {
  return prisma.tenantShippingZone.findMany({
    where: { tenantId, isActive: true },
    orderBy: { name: "asc" },
  });
}

export async function createShippingZone(
  tenantId: string,
  data: {
    name: string;
    countries: string[];
    carrier?: string;
    baseRate?: number;
    perKgRate?: number;
    freeAbove?: number;
    currency?: string;
    etaDays?: number;
  }
) {
  return prisma.tenantShippingZone.create({ data: { tenantId, ...data } });
}

export function calculateShipping(
  zones: { countries: string[]; baseRate: unknown; perKgRate: unknown; freeAbove: unknown }[],
  countryCode: string,
  orderTotal: number,
  weightKg = 1
) {
  const zone = zones.find((z) => z.countries.includes(countryCode));
  if (!zone) return null;

  const base = Number(zone.baseRate);
  const perKg = Number(zone.perKgRate ?? 0);
  const freeAbove = zone.freeAbove != null ? Number(zone.freeAbove) : null;

  if (freeAbove != null && orderTotal >= freeAbove) return 0;
  return Math.round((base + perKg * weightKg) * 100) / 100;
}
