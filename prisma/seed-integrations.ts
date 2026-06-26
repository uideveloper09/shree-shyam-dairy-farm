import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PLUGINS = [
  {
    slug: "order-shiprocket",
    name: "Auto Shiprocket on Order",
    provider: "SHIPROCKET" as const,
    entryPoint: "lib/integrations/plugins#order-shiprocket",
    hooks: ["order.paid"],
  },
  {
    slug: "invoice-tally",
    name: "Export Invoice to Tally",
    provider: "TALLY" as const,
    entryPoint: "lib/integrations/plugins#invoice-tally",
    hooks: ["order.paid", "invoice.created"],
  },
  {
    slug: "analytics-ga",
    name: "GA4 Purchase Event",
    provider: "GOOGLE_ANALYTICS" as const,
    entryPoint: "lib/integrations/plugins#analytics-ga",
    hooks: ["order.paid"],
  },
];

async function main() {
  for (const p of PLUGINS) {
    await prisma.integrationPlugin.upsert({
      where: { slug: p.slug },
      create: {
        slug: p.slug,
        name: p.name,
        provider: p.provider,
        entryPoint: p.entryPoint,
        hooks: p.hooks,
        description: `Built-in plugin: ${p.name}`,
      },
      update: { name: p.name, hooks: p.hooks, isEnabled: true },
    });
  }
  console.log(`Seeded ${PLUGINS.length} integration plugins.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
