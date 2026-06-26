import { prisma } from "@/repositories/prisma";
import { deliverWebhook } from "@/lib/api/webhooks";

async function retryPendingWebhooks() {
  const pending = await prisma.webhookDelivery.findMany({
    where: {
      status: "pending",
      attempts: { lt: 5 },
      OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: new Date() } }],
    },
    take: 50,
    orderBy: { createdAt: "asc" },
  });

  for (const d of pending) {
    await deliverWebhook(d.id);
  }

  console.log(`Processed ${pending.length} webhook retries`);
}

retryPendingWebhooks().catch(console.error);
