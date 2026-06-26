import { prisma } from "@/repositories/prisma";
import { getAiReply } from "@/utils/chatAssistant";
import { getContent } from "@/utils/data";

export async function aiChat(
  userId: string,
  message: string,
  locale = "hi-IN",
  conversationId?: string
) {
  let conversation = conversationId
    ? await prisma.aIConversation.findFirst({
        where: { id: conversationId, userId },
        include: { messages: { orderBy: { createdAt: "asc" }, take: 20 } },
      })
    : null;

  if (!conversation) {
    conversation = await prisma.aIConversation.create({
      data: { userId, locale, channel: "admin", title: message.slice(0, 60) },
      include: { messages: true },
    });
  }

  await prisma.aIConversationMessage.create({
    data: { conversationId: conversation.id, role: "user", content: message },
  });

  const content = await getContent();
  const history = [
    ...(conversation.messages || []).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content: message },
  ];

  const farmContext = await buildFarmContext();
  const systemAugment = `\n\nFARM ERP DATA (use only these numbers):\n${farmContext}`;

  const { reply, mode } = await getAiReply(
    [{ role: "user", content: `Context:${systemAugment}\n\nUser: ${message}` }],
    content
  );

  await prisma.aIConversationMessage.create({
    data: { conversationId: conversation.id, role: "assistant", content: reply },
  });

  return { conversationId: conversation.id, reply, mode, locale };
}

async function buildFarmContext(): Promise<string> {
  const [orderCount, activeSubs, devices, emergencies] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: new Date(Date.now() - 86400000) } } }),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
    prisma.ioTDevice.count({ where: { status: "ONLINE" } }),
    prisma.emergencyEvent.count({
      where: { acknowledgedAt: null, severity: "CRITICAL" },
    }),
  ]);
  return `Orders last 24h: ${orderCount}\nActive subscriptions: ${activeSubs}\nIoT devices online: ${devices}\nActive critical emergencies: ${emergencies}`;
}

export async function listInsights() {
  return prisma.aIInsight.findMany({
    take: 20,
    orderBy: { generatedAt: "desc" },
  });
}

export async function listAiAlerts(unackOnly = false) {
  return prisma.aIAlert.findMany({
    where: unackOnly ? { acknowledgedAt: null } : undefined,
    take: 50,
    orderBy: { createdAt: "desc" },
  });
}

export async function createPrediction(data: {
  domain: string;
  horizon: string;
  pointValue?: number;
  valueLow?: number;
  valueHigh?: number;
  valueJson?: object;
  confidence?: number;
  validFrom: Date;
  validTo: Date;
}) {
  return prisma.aIPrediction.create({
    data: {
      domain: data.domain as
        | "MILK"
        | "DEMAND"
        | "INVENTORY"
        | "PROFIT"
        | "DISEASE"
        | "WEATHER_IMPACT"
        | "PRODUCTION_PLAN",
      horizon: data.horizon,
      pointValue: data.pointValue,
      valueLow: data.valueLow,
      valueHigh: data.valueHigh,
      valueJson: data.valueJson,
      confidence: data.confidence,
      validFrom: data.validFrom,
      validTo: data.validTo,
    },
  });
}

export async function listRecommendations() {
  return prisma.aIRecommendation.findMany({
    take: 30,
    orderBy: { createdAt: "desc" },
  });
}
