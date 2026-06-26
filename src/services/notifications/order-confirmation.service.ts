/**
 * Order confirmation notification service.
 *
 * Sends customer email, WhatsApp, optional SMS, and admin alerts after successful payment.
 * Uses the shared notification dispatcher for delivery, retries, and channel abstraction.
 */
import { paymentLogger } from "@/lib/logging/payment";
import { sendNotification } from "@/modules/notifications/dispatcher";
import {
  getAdminNotificationEmails,
  getAdminUserIds,
  getOrderNotificationDetails,
  markOrderConfirmationNotified,
} from "@/repositories/order-notification.repository";
import {
  buildAdminNotificationBody,
  buildCustomerEmailBody,
  buildCustomerEmailHtml,
  buildCustomerEmailSubject,
  buildCustomerSmsBody,
  buildCustomerWhatsAppBody,
  buildOrderConfirmationContext,
} from "./order-confirmation.templates";
import type {
  ChannelNotificationResult,
  OrderConfirmationNotificationResult,
} from "./order-confirmation.types";

export type {
  OrderConfirmationContext,
  OrderConfirmationNotificationResult,
} from "./order-confirmation.types";

/**
 * Dispatches all order confirmation notifications for a paid order.
 * Idempotent — skips if `confirmationNotifiedAt` is already set.
 */
export async function sendOrderConfirmationNotifications(
  orderId: string,
  options?: { force?: boolean }
): Promise<OrderConfirmationNotificationResult> {
  const order = await getOrderNotificationDetails(orderId);

  if (!order) {
    return {
      sent: false,
      skipped: true,
      reason: "order_not_found",
      channels: [],
    };
  }

  if (order.confirmationNotifiedAt && !options?.force) {
    return {
      sent: false,
      skipped: true,
      reason: "already_notified",
      channels: [],
    };
  }

  const customerName = order.user?.name || order.guestEmail?.split("@")[0] || "Customer";
  const customerEmail = order.user?.email ?? order.guestEmail ?? undefined;
  const customerPhone = order.user?.phone ?? order.guestPhone ?? undefined;

  const context = buildOrderConfirmationContext({
    orderId: order.id,
    orderNumber: order.orderNumber,
    paymentStatus: order.paymentStatus,
    total: order.total.toString(),
    invoiceUrl: order.invoiceUrl,
    deliveryDate: order.deliveryDate,
    deliverySlot: order.deliverySlot,
    customerName,
    customerEmail,
    customerPhone,
    userId: order.userId ?? undefined,
    itemCount: order._count.items,
  });

  const channels: ChannelNotificationResult[] = [];

  channels.push(
    await dispatchChannel("EMAIL", {
      userId: context.userId,
      recipient: context.customerEmail,
      title: buildCustomerEmailSubject(context),
      body: buildCustomerEmailBody(context),
      data: {
        orderId: context.orderId,
        orderNumber: context.orderNumber,
        event: "order.paid.confirmation",
        html: buildCustomerEmailHtml(context),
        invoiceLink: context.invoiceLink,
        estimatedDelivery: context.estimatedDelivery,
        paymentStatus: context.paymentStatus,
        amount: context.amountFormatted,
      },
    })
  );

  channels.push(
    await dispatchChannel("WHATSAPP", {
      userId: context.userId,
      recipient: context.customerPhone,
      title: "Order Confirmed",
      body: buildCustomerWhatsAppBody(context),
      data: {
        orderId: context.orderId,
        orderNumber: context.orderNumber,
        event: "order.paid.confirmation",
      },
    })
  );

  // SMS channel — ready for MSG91; no-ops gracefully when not configured.
  channels.push(
    await dispatchChannel("SMS", {
      userId: context.userId,
      recipient: context.customerPhone,
      title: "Order Confirmed",
      body: buildCustomerSmsBody(context),
      data: {
        orderId: context.orderId,
        orderNumber: context.orderNumber,
        event: "order.paid.confirmation",
      },
    })
  );

  const adminEmails = await getAdminNotificationEmails();
  for (const adminEmail of adminEmails) {
    channels.push(
      await dispatchChannel("EMAIL", {
        recipient: adminEmail,
        title: `New Order ${context.orderNumber} — ${context.amountFormatted}`,
        body: buildAdminNotificationBody(context),
        data: {
          orderId: context.orderId,
          orderNumber: context.orderNumber,
          event: "order.paid.admin",
          audience: "admin",
          paymentStatus: context.paymentStatus,
          amount: context.amountFormatted,
          invoiceLink: context.invoiceLink,
          estimatedDelivery: context.estimatedDelivery,
        },
      })
    );
  }

  const adminUserIds = await getAdminUserIds();
  for (const adminUserId of adminUserIds) {
    channels.push(
      await dispatchChannel("IN_APP", {
        userId: adminUserId,
        title: `New order ${context.orderNumber}`,
        body: `${context.paymentStatus} — ${context.amountFormatted}. Delivery: ${context.estimatedDelivery}`,
        data: {
          orderId: context.orderId,
          orderNumber: context.orderNumber,
          event: "order.paid.admin",
          invoiceLink: context.invoiceLink,
        },
      })
    );
  }

  await markOrderConfirmationNotified(orderId);

  paymentLogger.info("order_confirmation_notifications_sent", {
    provider: "notifications",
    action: "order_confirmation",
    orderId,
    status: "queued",
  });

  const sent = channels.some((channel) => !channel.skipped && !channel.error);

  return {
    sent,
    channels,
  };
}

async function dispatchChannel(
  channel: ChannelNotificationResult["channel"],
  input: {
    userId?: string;
    recipient?: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
  }
): Promise<ChannelNotificationResult> {
  if (!input.recipient && !input.userId) {
    return { channel, skipped: true, error: "no_recipient" };
  }

  try {
    const result = await sendNotification({
      channel,
      userId: input.userId,
      recipient: input.recipient,
      type: "TRANSACTIONAL",
      priority: channel === "IN_APP" ? "HIGH" : "NORMAL",
      title: input.title,
      body: input.body,
      data: input.data,
    });

    return {
      channel,
      deliveryId: result.deliveryId,
      queued: "queued" in result ? result.queued : undefined,
    };
  } catch (error) {
    return {
      channel,
      error: error instanceof Error ? error.message : "notification_failed",
    };
  }
}
