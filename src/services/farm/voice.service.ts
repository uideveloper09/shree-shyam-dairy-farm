import { prisma } from "@/repositories/prisma";
import { getAiReply } from "@/utils/chatAssistant";
import { getContent } from "@/utils/data";

const COMMAND_PATTERNS: Array<{
  intent: string;
  patterns: RegExp[];
  handler: (text: string) => Promise<string>;
}> = [
  {
    intent: "MILK_SUMMARY",
    patterns: [/doodh|milk|production/i],
    handler: async () => {
      const snap = await prisma.predictionSnapshot.findFirst({
        where: { domain: "MILK" },
        orderBy: { createdAt: "desc" },
      });
      return snap
        ? `Anumaanit doodh kal: ${snap.pointValue} litre (${snap.valueLow}-${snap.valueHigh}L)`
        : "Abhi doodh prediction uplabdh nahi hai.";
    },
  },
  {
    intent: "ORDERS_TODAY",
    patterns: [/order|aaj.*order/i],
    handler: async () => {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const count = await prisma.order.count({ where: { createdAt: { gte: start } } });
      return `Aaj ${count} orders mile hain.`;
    },
  },
  {
    intent: "WEATHER",
    patterns: [/mausam|weather|thi|garmi/i],
    handler: async () => {
      const w = await prisma.weatherReading.findFirst({ orderBy: { recordedAt: "desc" } });
      return w
        ? `Latest weather reading: ${w.sensorType} = ${w.value}`
        : "Weather station data abhi uplabdh nahi hai.";
    },
  },
];

export async function processVoiceInput(userId: string, transcript: string, locale = "HI_IN") {
  const session = await prisma.voiceSession.create({
    data: { userId, locale, channel: "admin" },
  });

  await prisma.voiceTranscript.create({
    data: { sessionId: session.id, direction: "IN", text: transcript, locale },
  });

  for (const cmd of COMMAND_PATTERNS) {
    if (cmd.patterns.some((p) => p.test(transcript))) {
      const reply = await cmd.handler(transcript);
      await prisma.voiceTranscript.create({
        data: { sessionId: session.id, direction: "OUT", text: reply, locale },
      });
      return {
        sessionId: session.id,
        mode: "command",
        intent: cmd.intent,
        reply,
        playOnClient: true,
      };
    }
  }

  const content = await getContent();
  const { reply } = await getAiReply([{ role: "user", content: transcript }], content);

  await prisma.voiceTranscript.create({
    data: { sessionId: session.id, direction: "OUT", text: reply, locale },
  });

  return { sessionId: session.id, mode: "assistant", reply, playOnClient: true };
}

export async function getOrCreateVoiceProfile(userId: string) {
  return prisma.voiceProfile.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
}
