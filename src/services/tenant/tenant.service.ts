import { prisma } from "@/repositories/prisma";
import { nanoid } from "nanoid";
import { ensureDefaultTenant } from "@/lib/tenant/isolation";

export async function getTenantConfig(slug: string) {
  const tenant = await prisma.tenant.findFirst({
    where: { slug, isActive: true },
    include: {
      branding: true,
      theme: true,
      localeConfig: true,
      domains: { where: { verifiedAt: { not: null } } },
      subscription: true,
    },
  });

  if (!tenant) {
    const def = await ensureDefaultTenant();
    return formatTenantPublic(def);
  }

  return formatTenantPublic(tenant);
}

function formatTenantPublic(tenant: {
  id: string;
  slug: string;
  name: string;
  plan: string;
  branding: unknown;
  theme: unknown;
  localeConfig: unknown;
  domains: { domain: string; isPrimary: boolean }[];
  subscription: { plan: string; status: string } | null;
}) {
  return {
    id: tenant.id,
    slug: tenant.slug,
    name: tenant.name,
    plan: tenant.plan,
    branding: tenant.branding,
    theme: tenant.theme,
    locale: tenant.localeConfig,
    domains: tenant.domains.map((d) => ({ domain: d.domain, primary: d.isPrimary })),
    subscription: tenant.subscription
      ? { plan: tenant.subscription.plan, status: tenant.subscription.status }
      : null,
  };
}

export async function updateTenantBranding(
  tenantId: string,
  data: {
    logoUrl?: string;
    faviconUrl?: string;
    companyName?: string;
    tagline?: string;
    supportEmail?: string;
  }
) {
  return prisma.tenantBranding.upsert({
    where: { tenantId },
    create: { tenantId, ...data },
    update: data,
  });
}

export async function updateTenantTheme(
  tenantId: string,
  data: {
    primaryColor?: string;
    accentColor?: string;
    backgroundColor?: string;
    textColor?: string;
    customCss?: string;
  }
) {
  return prisma.tenantTheme.upsert({
    where: { tenantId },
    create: { tenantId, ...data },
    update: data,
  });
}

export async function updateTenantLocales(
  tenantId: string,
  defaultLocale: string,
  enabledLocales: string[]
) {
  return prisma.tenantLocaleConfig.upsert({
    where: { tenantId },
    create: { tenantId, defaultLocale, enabledLocales },
    update: { defaultLocale, enabledLocales },
  });
}

export async function addTenantDomain(tenantId: string, domain: string) {
  const verifyToken = nanoid(32);
  return prisma.tenantDomain.create({
    data: { tenantId, domain: domain.toLowerCase(), verifyToken },
  });
}

export async function verifyTenantDomain(domain: string, token: string) {
  const record = await prisma.tenantDomain.findFirst({
    where: { domain: domain.toLowerCase(), verifyToken: token },
  });
  if (!record) return null;

  return prisma.tenantDomain.update({
    where: { id: record.id },
    data: { verifiedAt: new Date(), verifyToken: null, sslStatus: "active" },
  });
}

export async function getTenantAnalytics(tenantId: string, days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const [daily, usage] = await Promise.all([
    prisma.tenantDailyAnalytics.findMany({
      where: { tenantId, date: { gte: since } },
      orderBy: { date: "asc" },
    }),
    prisma.usageRecord.groupBy({
      by: ["metric"],
      where: { tenantId, periodStart: { gte: since } },
      _sum: { quantity: true },
    }),
  ]);

  return {
    daily: daily.map((d) => ({
      ...d,
      revenue: Number(d.revenue),
    })),
    usage: Object.fromEntries(usage.map((u) => [u.metric, u._sum.quantity ?? 0])),
  };
}
