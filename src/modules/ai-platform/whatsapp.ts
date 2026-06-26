import { prisma } from "@/repositories/prisma";
import { getAiReply } from "@/utils/chatAssistant";
import { getContent } from "@/utils/data";

export async function processWhatsAppMessage(phone: string, body: string, userId?: string) {
  const session = await prisma.aiWhatsAppSession.upsert({
    where: { phone },
    create: { phone, userId, lastMessageAt: new Date() },
    update: { lastMessageAt: new Date(), userId },
  });

  await prisma.aiWhatsAppMessage.create({
    data: { sessionId: session.id, direction: "IN", body },
  });

  const content = await getContent();
  const { reply } = await getAiReply([{ role: "user", content: body }], content);

  await prisma.aiWhatsAppMessage.create({
    data: { sessionId: session.id, direction: "OUT", body: reply, aiReply: reply },
  });

  return { sessionId: session.id, reply };
}

export async function listWhatsAppSessions(limit = 20) {
  return prisma.aiWhatsAppSession.findMany({
    include: { _count: { select: { messages: true } } },
    orderBy: { lastMessageAt: "desc" },
    take: limit,
  });
}

export async function getWhatsAppHistory(sessionId: string) {
  return prisma.aiWhatsAppMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
    take: 50,
  });
}
