/**
 * Razorpay payment service — business logic for verified payment persistence.
 */
import { PaymentMethod, PaymentStatus, Prisma } from "@prisma/client";
import { publishPaymentDashboardRefresh } from "@/lib/payment/dashboard-events";
import { cancelOrderDueToInsufficientStock } from "@/repositories/inventory.repository";
import { paymentLogger } from "@/lib/logging/payment";
import {
  createPaymentAndMarkOrderPaid,
  ensureOrderPaidForExistingPayment,
  findOrderForPayment,
  findPaymentByRazorpayPaymentId,
} from "@/repositories/payment.repository";
import { isDatabaseConfigured } from "@/repositories/prisma";
import { fulfillOrderInventoryIfNeeded } from "@/services/inventory/inventory.service";
import { InsufficientInventoryError } from "@/services/inventory/types";
import { generateOrderInvoice } from "@/services/order/invoice.service";
import { sendOrderConfirmationNotifications } from "@/services/notifications/order-confirmation.service";
import type { PersistVerifiedPaymentInput, PersistVerifiedPaymentResult } from "./types";
import { OrderNotFoundForPaymentError, PaymentPersistenceError } from "./types";

const PAYMENT_METHODS = new Set<string>(Object.values(PaymentMethod));

async function dispatchOrderConfirmation(orderId: string): Promise<boolean> {
  try {
    const result = await sendOrderConfirmationNotifications(orderId);
    return result.sent;
  } catch (error) {
    paymentLogger.failed({
      provider: "notifications",
      action: "order_confirmation",
      orderId,
      error,
    });
    return false;
  }
}

function refreshAdminPaymentDashboard(orderId: string): void {
  publishPaymentDashboardRefresh({ orderId });
}

function resolvePaymentMethod(
  requested: PaymentMethod | undefined,
  orderMethod: PaymentMethod | null
): PaymentMethod {
  if (requested) return requested;
  if (orderMethod) return orderMethod;
  return PaymentMethod.UPI;
}

function resolveAmount(amount: number | undefined, orderTotal: Prisma.Decimal): Prisma.Decimal {
  if (amount !== undefined && Number.isFinite(amount) && amount > 0) {
    return new Prisma.Decimal(amount);
  }
  return orderTotal;
}

/**
 * Persists a verified Razorpay payment, updates the order, and decrements inventory
 * inside a single database transaction. Idempotent for duplicate payment IDs.
 */
export async function persistVerifiedPayment(
  input: PersistVerifiedPaymentInput
): Promise<PersistVerifiedPaymentResult> {
  if (!isDatabaseConfigured()) {
    throw new PaymentPersistenceError("Database is not configured");
  }

  const existingPayment = await findPaymentByRazorpayPaymentId(input.razorpayPaymentId);

  if (existingPayment) {
    paymentLogger.info("razorpay_payment_already_processed", {
      provider: "razorpay",
      action: "persist_payment",
      orderId: existingPayment.orderId,
      paymentId: existingPayment.razorpayPaymentId ?? undefined,
    });

    await ensureOrderPaidForExistingPayment(
      existingPayment.orderId,
      input.razorpayOrderId,
      input.razorpayPaymentId,
      existingPayment.method,
      existingPayment.paymentDate
    );

    const inventory = await fulfillOrderInventoryIfNeeded(existingPayment.orderId);

    const invoice = await generateOrderInvoice(existingPayment.orderId);

    const notificationsSent = await dispatchOrderConfirmation(existingPayment.orderId);

    return {
      paymentSaved: true,
      orderUpdated: true,
      inventoryUpdated: inventory.inventoryUpdated,
      stockUpdates: inventory.stockUpdates,
      invoiceGenerated: true,
      invoice,
      notificationsSent,
      alreadyProcessed: true,
      orderId: existingPayment.orderId,
      paymentId: existingPayment.id,
    };
  }

  const order = await findOrderForPayment({
    orderId: input.orderId,
    razorpayOrderId: input.razorpayOrderId,
  });

  if (!order) {
    throw new OrderNotFoundForPaymentError();
  }

  const paymentDate = new Date();
  const currency = input.currency?.trim().toUpperCase() || "INR";
  const method = resolvePaymentMethod(input.paymentMethod, order.paymentMethod);
  const amount = resolveAmount(input.amount, order.total);
  const customerId = input.customerId ?? order.userId ?? null;

  try {
    const {
      payment,
      order: updatedOrder,
      stockUpdates,
      inventoryUpdated,
    } = await createPaymentAndMarkOrderPaid({
      orderId: order.id,
      customerId,
      amount,
      currency,
      method,
      status: PaymentStatus.PAID,
      razorpayOrderId: input.razorpayOrderId,
      razorpayPaymentId: input.razorpayPaymentId,
      razorpaySignature: input.razorpaySignature,
      paymentDate,
      transactionReference: input.razorpayPaymentId,
    });

    paymentLogger.captured({
      provider: "razorpay",
      action: "persist_payment",
      orderId: updatedOrder.id,
      paymentId: payment.razorpayPaymentId ?? undefined,
      amount: Number(payment.amount),
      currency: payment.currency,
      status: payment.status,
    });

    refreshAdminPaymentDashboard(updatedOrder.id);

    const invoice = await generateOrderInvoice(updatedOrder.id);

    const notificationsSent = await dispatchOrderConfirmation(updatedOrder.id);

    return {
      paymentSaved: true,
      orderUpdated: true,
      inventoryUpdated,
      stockUpdates,
      invoiceGenerated: true,
      invoice,
      notificationsSent,
      alreadyProcessed: false,
      orderId: updatedOrder.id,
      paymentId: payment.id,
    };
  } catch (error) {
    if (error instanceof InsufficientInventoryError) {
      await cancelOrderDueToInsufficientStock(order.id);

      paymentLogger.failed({
        provider: "inventory",
        action: "persist_payment",
        orderId: order.id,
        paymentId: input.razorpayPaymentId,
        error,
      });

      throw error;
    }

    paymentLogger.failed({
      provider: "razorpay",
      action: "persist_payment",
      orderId: order.id,
      paymentId: input.razorpayPaymentId,
      error,
    });

    throw new PaymentPersistenceError(
      error instanceof Error ? error.message : "Failed to persist payment"
    );
  }
}

/** Validates a client-provided payment method string against the Prisma enum. */
export function parsePaymentMethod(value: unknown): PaymentMethod | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toUpperCase();
  if (PAYMENT_METHODS.has(normalized)) {
    return normalized as PaymentMethod;
  }
  return undefined;
}
