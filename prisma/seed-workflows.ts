import { PrismaClient } from "@prisma/client";
import { buildVisualFromSteps } from "@/modules/workflows/visual";

const prisma = new PrismaClient();

const DEFAULT_WORKFLOWS = [
  {
    slug: "expense-standard",
    name: "Expense Approval",
    type: "EXPENSE" as const,
    steps: [
      { order: 0, name: "Manager Review", approverRole: "FARM_MANAGER" },
      { order: 1, name: "Finance Approval", approverRole: "ACCOUNTANT", minAmount: 5000 },
      { order: 2, name: "Owner Sign-off", approverRole: "OWNER", minAmount: 50000 },
    ],
    conditions: [{ field: "amount", operator: "gte", value: 0, logicGroup: "AND" }],
  },
  {
    slug: "purchase-standard",
    name: "Purchase Approval",
    type: "PURCHASE" as const,
    steps: [
      { order: 0, name: "Farm Manager", approverRole: "FARM_MANAGER" },
      { order: 1, name: "Accountant", approverRole: "ACCOUNTANT", minAmount: 10000 },
      { order: 2, name: "Owner", approverRole: "OWNER", minAmount: 100000 },
    ],
  },
  {
    slug: "leave-standard",
    name: "Leave Approval",
    type: "LEAVE" as const,
    steps: [
      { order: 0, name: "Manager Approval", approverRole: "FARM_MANAGER" },
      { order: 1, name: "HR / Owner", approverRole: "OWNER" },
    ],
    triggers: [{ type: "MANUAL", event: "leave.requested" }],
  },
  {
    slug: "refund-standard",
    name: "Refund Approval",
    type: "REFUND" as const,
    steps: [
      { order: 0, name: "Support Review", approverRole: "ADMIN" },
      { order: 1, name: "Finance", approverRole: "ACCOUNTANT", minAmount: 1000 },
    ],
    triggers: [{ type: "EVENT", event: "order.refund_requested" }],
    conditions: [{ field: "amount", operator: "gte", value: 0, logicGroup: "AND" }],
  },
  {
    slug: "subscription-standard",
    name: "Subscription Approval",
    type: "SUBSCRIPTION" as const,
    steps: [{ order: 0, name: "Admin Review", approverRole: "ADMIN" }],
    triggers: [{ type: "EVENT", event: "subscription.change_requested" }],
  },
];

async function main() {
  for (const wf of DEFAULT_WORKFLOWS) {
    const existing = await prisma.workflowDefinition.findFirst({
      where: { slug: wf.slug, tenantId: null },
    });

    const visual = buildVisualFromSteps(wf.steps);

    if (existing) {
      await prisma.workflowDefinition.update({
        where: { id: existing.id },
        data: { visual: visual as object, isActive: true },
      });
      continue;
    }

    await prisma.workflowDefinition.create({
      data: {
        slug: wf.slug,
        name: wf.name,
        type: wf.type,
        visual: visual as object,
        steps: { create: wf.steps },
        conditions: wf.conditions ? { create: wf.conditions } : undefined,
        triggers: wf.triggers
          ? {
              create: wf.triggers.map((t) => ({
                type: t.type as "MANUAL" | "EVENT",
                event: t.event,
              })),
            }
          : undefined,
        automationRules: {
          create: [
            {
              name: `${wf.slug} auto-notify`,
              event: `${wf.type.toLowerCase()}.submitted`,
              action: "notify_approver",
            },
          ],
        },
      },
    });
  }

  console.log("Workflow definitions seeded.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
