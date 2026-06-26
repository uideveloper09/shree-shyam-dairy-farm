import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const AGENTS = [
  {
    slug: "farm-monitor",
    name: "Farm Monitor Agent",
    description: "Reads milk forecasts, IoT status, and farm emergencies",
    tools: ["read_milk_forecast", "read_emergencies", "read_inventory"],
    requiresConfirm: false,
    isAutonomous: true,
  },
  {
    slug: "sales-assistant",
    name: "Sales Assistant Agent",
    description: "Queries orders, pipeline, and creates draft quotations",
    tools: ["read_orders", "read_subscriptions"],
    requiresConfirm: true,
    isAutonomous: false,
  },
  {
    slug: "customer-care",
    name: "Customer Care Agent",
    description: "Handles support context and loyalty lookups",
    tools: ["read_orders"],
    requiresConfirm: false,
    isAutonomous: false,
  },
  {
    slug: "inventory-optimizer",
    name: "Inventory Optimizer",
    description: "Monitors stock levels and expiry alerts autonomously",
    tools: ["read_inventory"],
    requiresConfirm: false,
    isAutonomous: true,
  },
  {
    slug: "ceo-briefing",
    name: "CEO Briefing Agent",
    description: "Daily executive summary across all ERP modules",
    tools: ["read_orders", "read_milk_forecast", "read_inventory", "read_emergencies"],
    requiresConfirm: false,
    isAutonomous: true,
  },
];

async function main() {
  for (const a of AGENTS) {
    await prisma.aiAgentDefinition.upsert({
      where: { slug: a.slug },
      create: {
        slug: a.slug,
        name: a.name,
        description: a.description,
        tools: a.tools,
        requiresConfirm: a.requiresConfirm,
        isAutonomous: a.isAutonomous,
      },
      update: {
        name: a.name,
        description: a.description,
        tools: a.tools,
        isActive: true,
      },
    });
  }

  if (!(await prisma.aiWhatsAppSession.findFirst())) {
    const session = await prisma.aiWhatsAppSession.create({
      data: { phone: "+919876543210", locale: "hi-IN" },
    });
    await prisma.aiWhatsAppMessage.createMany({
      data: [
        { sessionId: session.id, direction: "IN", body: "Aaj ka doodh rate kya hai?" },
        {
          sessionId: session.id,
          direction: "OUT",
          body: "Hamare fresh A2 milk ki rates website par uplabdh hain. Kripya products section dekhein.",
          aiReply: "Hamare fresh A2 milk ki rates website par uplabdh hain.",
        },
      ],
    });
  }

  console.log(`Seeded ${AGENTS.length} AI agent definitions.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
