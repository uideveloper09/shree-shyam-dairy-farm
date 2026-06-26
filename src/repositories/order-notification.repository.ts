/**
 * Order notification repository — loads order data for confirmation messages.
 */
import type { DeliverySlot, PaymentStatus } from "@prisma/client";
import { prisma } from "@/repositories/prisma";

export interface OrderNotificationRecord {
  id: string;
  orderNumber: string;
  paymentStatus: PaymentStatus;
  total: { toString(): string };
  invoiceUrl: string | null;
  deliveryDate: Date | null;
  deliverySlot: DeliverySlot | null;
  guestEmail: string | null;
  guestPhone: string | null;
  confirmationNotifiedAt: Date | null;
  userId: string | null;
  user: {
    name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  _count: { items: number };
}

/**
 * Loads order details required for customer and admin notifications.
 */
export async function getOrderNotificationDetails(
  orderId: string
): Promise<OrderNotificationRecord | null> {
  return prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderNumber: true,
      paymentStatus: true,
      total: true,
      guestEmail: true,
      guestPhone: true,
      invoiceUrl: true,
      deliveryDate: true,
      deliverySlot: true,
      confirmationNotifiedAt: true,
      userId: true,
      user: {
        select: {
          name: true,
          email: true,
          phone: true,
        },
      },
      _count: { select: { items: true } },
    },
  });
}

/**
 * Marks that order confirmation notifications were dispatched (idempotency).
 */
export async function markOrderConfirmationNotified(orderId: string): Promise<void> {
  await prisma.order.update({
    where: { id: orderId },
    data: { confirmationNotifiedAt: new Date() },
  });
}

/**
 * Returns email addresses for admin alert notifications.
 */
export async function getAdminNotificationEmails(): Promise<string[]> {
  const configured = process.env.ADMIN_NOTIFICATION_EMAIL?.trim();
  const emails = new Set<string>();

  if (configured) {
    configured.split(",").forEach((entry) => {
      const email = entry.trim();
      if (email) emails.add(email);
    });
  }

  const admins = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "OWNER"] }, email: { not: null } },
    select: { email: true },
    take: 10,
  });

  for (const admin of admins) {
    if (admin.email) emails.add(admin.email);
  }

  if (emails.size === 0 && process.env.EMAIL_FROM) {
    emails.add(process.env.EMAIL_FROM);
  }

  return [...emails];
}

/**
 * Returns admin user IDs for in-app notifications.
 */
export async function getAdminUserIds(): Promise<string[]> {
  const admins = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "OWNER", "FARM_MANAGER"] } },
    select: { id: true },
    take: 20,
  });

  return admins.map((admin) => admin.id);
}
