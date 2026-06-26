import { randomBytes } from "crypto";
import { prisma } from "@/repositories/prisma";

const READ_TOOLS: Record<string, () => Promise<unknown>> = {
  read_orders: async () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: start } },
      take: 10,
      orderBy: { createdAt: "desc" },
      select: { orderNumber: true, status: true, total: true },
    });
    return { count: orders.length, orders };
  },
  read_subscriptions: async () => {
    const count = await prisma.subscription.count({ where: { status: "ACTIVE" } });
    return { activeSubscriptions: count };
  },
  read_inventory: async () => {
    const low = await prisma.product.findMany({
      where: { stockQty: { lt: 20 }, isActive: true },
      select: { name: true, stockQty: true },
      take: 10,
    });
    return { lowStock: low };
  },
  read_milk_forecast: async () => {
    return prisma.predictionSnapshot.findFirst({
      where: { domain: "MILK" },
      orderBy: { createdAt: "desc" },
    });
  },
  read_emergencies: async () => {
    return prisma.emergencyEvent.findMany({
      where: { acknowledgedAt: null },
      take: 5,
      orderBy: { createdAt: "desc" },
    });
  },
};

function detectTool(prompt: string): string | null {
  const p = prompt.toLowerCase();
  if (p.includes("order")) return "read_orders";
  if (p.includes("subscription")) return "read_subscriptions";
  if (p.includes("inventory") || p.includes("stock")) return "read_inventory";
  if (p.includes("milk") || p.includes("doodh")) return "read_milk_forecast";
  if (p.includes("emergency") || p.includes("alert")) return "read_emergencies";
  return null;
}

export async function runAgent(userId: string, prompt: string) {
  const run = await prisma.agentRun.create({
    data: { userId, prompt, status: "RUNNING" },
  });

  const steps: Array<Record<string, unknown>> = [];
  const tool = detectTool(prompt);

  if (tool && READ_TOOLS[tool]) {
    const result = await READ_TOOLS[tool]();
    steps.push({ tool, result });
    const resultText = JSON.stringify(result, null, 2);
    const finalResult = `Tool ${tool} result:\n${resultText}\n\nSummary: Data retrieved from ERP.`;

    await prisma.agentRun.update({
      where: { id: run.id },
      data: {
        status: "COMPLETED",
        result: finalResult,
        steps: steps as object,
        completedAt: new Date(),
      },
    });

    return { runId: run.id, status: "COMPLETED", result: finalResult, steps };
  }

  if (prompt.toLowerCase().includes("create order")) {
    const token = randomBytes(16).toString("hex");
    const action = await prisma.agentAction.create({
      data: {
        runId: run.id,
        toolName: "create_order",
        parameters: { prompt },
        status: "PENDING",
        requiresConfirm: true,
        confirmToken: token,
      },
    });

    await prisma.agentRun.update({
      where: { id: run.id },
      data: { status: "AWAITING_CONFIRMATION", steps: [{ action: action.id }] as object },
    });

    return {
      runId: run.id,
      status: "AWAITING_CONFIRMATION",
      confirmToken: token,
      message: "Order creation requires confirmation. Use POST /api/v1/agent/runs/{id}/confirm",
    };
  }

  const { aiChat } = await import("@/services/farm/ai.service");
  const chat = await aiChat(userId, prompt);

  await prisma.agentRun.update({
    where: { id: run.id },
    data: {
      status: "COMPLETED",
      result: chat.reply,
      completedAt: new Date(),
    },
  });

  return { runId: run.id, status: "COMPLETED", result: chat.reply };
}

export async function confirmAgentAction(runId: string, confirmToken: string, userId: string) {
  const action = await prisma.agentAction.findFirst({
    where: { runId, confirmToken, status: "PENDING" },
    include: { run: true },
  });

  if (!action || action.run.userId !== userId) {
    throw new Error("Invalid confirmation");
  }

  await prisma.agentAction.update({
    where: { id: action.id },
    data: { status: "CONFIRMED", result: { confirmed: true } },
  });

  await prisma.agentRun.update({
    where: { id: runId },
    data: { status: "COMPLETED", completedAt: new Date(), result: "Action confirmed (stub)" },
  });

  return { success: true };
}

export async function listAgentRuns(userId: string) {
  return prisma.agentRun.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { actions: true },
  });
}
