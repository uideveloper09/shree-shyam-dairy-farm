import { PrismaClient } from "@prisma/client";
import { ensureDefaultTenant } from "@/lib/tenant/isolation";

const prisma = new PrismaClient();

const LISTINGS = [
  {
    slug: "crm-suite",
    name: "CRM Suite",
    type: "APP" as const,
    category: "Sales",
    description: "Leads, pipeline, quotations, and support tickets",
    entryPoint: "/admin/crm",
    isFeatured: true,
  },
  {
    slug: "fleet-manager",
    name: "Fleet Manager",
    type: "APP" as const,
    category: "Operations",
    description: "Vehicles, drivers, trips, and milk tanker tracking",
    entryPoint: "/admin/fleet",
  },
  {
    slug: "retail-pos",
    name: "Retail POS",
    type: "APP" as const,
    category: "Retail",
    description: "Point of sale, GST billing, and thermal printing",
    entryPoint: "/admin/retail",
    isFeatured: true,
  },
  {
    slug: "order-shiprocket",
    name: "Shiprocket Connector",
    type: "PLUGIN" as const,
    category: "Shipping",
    description: "Auto-create Shiprocket shipments on paid orders",
    price: 499,
  },
  {
    slug: "invoice-tally",
    name: "Tally Export",
    type: "PLUGIN" as const,
    category: "Accounting",
    description: "Export invoices to Tally on order paid",
    price: 299,
  },
  {
    slug: "orders-api",
    name: "Orders REST API",
    type: "API" as const,
    category: "Developer",
    description: "Programmatic order creation and status webhooks",
    entryPoint: "/developers#orders",
    isFeatured: true,
  },
  {
    slug: "inventory-api",
    name: "Inventory REST API",
    type: "API" as const,
    category: "Developer",
    description: "Stock levels, batches, and expiry alerts via API",
    entryPoint: "/developers#inventory",
  },
  {
    slug: "milk-forecast-api",
    name: "Milk Forecast API",
    type: "API" as const,
    category: "Farm",
    description: "Daily yield predictions and herd analytics",
    entryPoint: "/developers#farm",
  },
];

const PARTNERS = [
  {
    type: "PARTNER" as const,
    slug: "dairy-tech-india",
    name: "DairyTech India",
    email: "partner@dairytech.in",
    commissionRate: 15,
  },
  {
    type: "RESELLER" as const,
    slug: "agri-solutions",
    name: "Agri Solutions Reseller",
    email: "reseller@agrisolutions.in",
    commissionRate: 20,
  },
];

const SHIPPING_ZONES = [
  {
    name: "India Metro",
    countries: ["IN"],
    carrier: "Delhivery",
    baseRate: 49,
    perKgRate: 12,
    freeAbove: 999,
    etaDays: 2,
  },
  {
    name: "GCC",
    countries: ["AE", "SA", "QA"],
    carrier: "Aramex",
    baseRate: 299,
    perKgRate: 45,
    freeAbove: 4999,
    currency: "AED",
    etaDays: 5,
  },
  {
    name: "Europe",
    countries: ["GB", "DE", "FR"],
    carrier: "DHL",
    baseRate: 899,
    perKgRate: 120,
    currency: "EUR",
    etaDays: 7,
  },
];

async function main() {
  const tenant = await ensureDefaultTenant();

  for (const l of LISTINGS) {
    await prisma.saasMarketplaceListing.upsert({
      where: { slug: l.slug },
      create: {
        slug: l.slug,
        name: l.name,
        type: l.type,
        category: l.category,
        description: l.description,
        entryPoint: l.entryPoint,
        price: l.price ?? 0,
        isFeatured: l.isFeatured ?? false,
        isPublished: true,
      },
      update: {
        name: l.name,
        description: l.description,
        isPublished: true,
      },
    });
  }

  const featured = await prisma.saasMarketplaceListing.findFirst({
    where: { slug: "crm-suite" },
  });
  if (featured) {
    await prisma.saasMarketplaceInstall.upsert({
      where: { tenantId_listingId: { tenantId: tenant.id, listingId: featured.id } },
      create: { tenantId: tenant.id, listingId: featured.id },
      update: { status: "active" },
    });
  }

  for (const p of PARTNERS) {
    await prisma.saasPartner.upsert({
      where: { slug: p.slug },
      create: p,
      update: { name: p.name, email: p.email, isActive: true },
    });
  }

  const partner = await prisma.saasPartner.findUnique({ where: { slug: "dairy-tech-india" } });
  if (partner) {
    await prisma.saasPartnerTenant.upsert({
      where: { partnerId_tenantId: { partnerId: partner.id, tenantId: tenant.id } },
      create: { partnerId: partner.id, tenantId: tenant.id, commissionRate: 15 },
      update: {},
    });
  }

  await prisma.tenantRegionalSettings.upsert({
    where: { tenantId: tenant.id },
    create: { tenantId: tenant.id },
    update: {},
  });

  const taxCount = await prisma.tenantTaxRule.count({ where: { tenantId: tenant.id } });
  if (taxCount === 0) {
    await prisma.tenantTaxRule.createMany({
      data: [
        {
          tenantId: tenant.id,
          countryCode: "IN",
          taxName: "GST",
          taxType: "GST",
          rate: 5,
          hsnCode: "0401",
        },
        { tenantId: tenant.id, countryCode: "US", taxName: "Sales Tax", taxType: "SALES", rate: 7 },
        { tenantId: tenant.id, countryCode: "AE", taxName: "VAT", taxType: "VAT", rate: 5 },
        { tenantId: tenant.id, countryCode: "GB", taxName: "VAT", taxType: "VAT", rate: 20 },
      ],
    });
  }

  for (const z of SHIPPING_ZONES) {
    const existing = await prisma.tenantShippingZone.findFirst({
      where: { tenantId: tenant.id, name: z.name },
    });
    if (!existing) {
      await prisma.tenantShippingZone.create({
        data: { tenantId: tenant.id, ...z },
      });
    }
  }

  console.log(
    `SaaS seed complete: ${LISTINGS.length} listings, ${PARTNERS.length} partners, tenant ${tenant.slug}`
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
