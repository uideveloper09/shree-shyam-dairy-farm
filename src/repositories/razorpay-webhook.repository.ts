/**
 * Razorpay webhook event repository — audit log and idempotency.
 */
import type { Prisma } from "@prisma/client";
import { prisma } from "@/repositories/prisma";

export interface SaveWebhookEventInput {
  eventId: string;
  eventType: string;
  payload: Prisma.InputJsonValue;
}

/**
 * Returns a stored webhook event by Razorpay event ID.
 */
export async function findWebhookEventByEventId(eventId: string) {
  return prisma.razorpayWebhookEvent.findUnique({
    where: { eventId },
  });
}

/**
 * Persists a webhook event for auditing. Returns null when the event already exists.
 */
export async function createWebhookEventRecord(input: SaveWebhookEventInput) {
  try {
    return await prisma.razorpayWebhookEvent.create({
      data: {
        eventId: input.eventId,
        eventType: input.eventType,
        payload: input.payload,
        processed: false,
      },
    });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return null;
    }
    throw error;
  }
}

/**
 * Marks a webhook event as successfully processed.
 */
export async function markWebhookEventProcessed(eventId: string): Promise<void> {
  await prisma.razorpayWebhookEvent.update({
    where: { eventId },
    data: { processed: true },
  });
}
