import { prisma } from "@/repositories/prisma";

/**
 * Generates a unique daily order number (e.g. SSD-20260626-0001).
 */
export async function generateOrderNumber(): Promise<string> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const datePart = today.toISOString().slice(0, 10).replace(/-/g, "");
  const countToday = await prisma.order.count({
    where: { createdAt: { gte: today } },
  });

  const sequence = String(countToday + 1).padStart(4, "0");
  return `SSD-${datePart}-${sequence}`;
}
