import type { Subscription, Product, SubscriptionDelivery } from "@prisma/client";
import {
  FREQUENCY_LABELS,
  SLOT_LABELS,
  STATUS_LABELS,
  buildDeliveryCalendar,
} from "@/services/subscription";

export type SubscriptionWithRelations = Subscription & {
  product: Pick<Product, "id" | "name" | "price" | "unit" | "images" | "legacyId">;
  deliveries: SubscriptionDelivery[];
};

export function serializeSubscription(sub: SubscriptionWithRelations) {
  const calendar = buildDeliveryCalendar(
    {
      frequency: sub.frequency,
      customDays: sub.customDays,
      startDate: sub.startDate,
      status: sub.status,
      pausedUntil: sub.pausedUntil,
      vacationUntil: sub.vacationUntil,
    },
    sub.deliveries.map((d) => ({
      scheduledDate: d.scheduledDate,
      skipped: d.skipped,
      status: d.status,
      deliveredAt: d.deliveredAt,
    }))
  );

  return {
    id: sub.id,
    product: {
      id: sub.product.legacyId ?? sub.product.id,
      name: sub.product.name,
      price: Number(sub.product.price),
      unit: sub.product.unit,
      image: sub.product.images[0] ?? null,
    },
    frequency: sub.frequency,
    frequencyLabel: FREQUENCY_LABELS[sub.frequency],
    status: sub.status,
    statusLabel: STATUS_LABELS[sub.status],
    quantity: sub.quantity,
    deliverySlot: sub.deliverySlot,
    deliverySlotLabel: SLOT_LABELS[sub.deliverySlot],
    customDays: sub.customDays,
    startDate: sub.startDate.toISOString(),
    nextDelivery: sub.nextDelivery?.toISOString() ?? null,
    pausedUntil: sub.pausedUntil?.toISOString() ?? null,
    vacationUntil: sub.vacationUntil?.toISOString() ?? null,
    razorpaySubId: sub.razorpaySubId,
    hasAutoPay: Boolean(sub.razorpaySubId),
    calendar,
    recentDeliveries: sub.deliveries
      .slice()
      .sort((a, b) => b.scheduledDate.getTime() - a.scheduledDate.getTime())
      .slice(0, 10)
      .map((d) => ({
        id: d.id,
        date: d.scheduledDate.toISOString(),
        status: d.skipped ? "skipped" : d.status,
        deliveredAt: d.deliveredAt?.toISOString() ?? null,
      })),
    createdAt: sub.createdAt.toISOString(),
  };
}
