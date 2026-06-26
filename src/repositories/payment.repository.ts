/**
 * Payment repository — database access for Razorpay payment persistence.
 */
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  type Order,
  type Payment,
} from "@prisma/client";
import { fulfillOrderInventoryInTransaction } from "@/services/inventory/inventory.service";
import type { StockUpdateResult } from "@/services/inventory/types";
import { prisma } from "@/repositories/prisma";

export type OrderForPayment = Pick<
  Order,
  "id" | "userId" | "total" | "paymentMethod" | "razorpayOrderId" | "paymentStatus" | "status"
>;

export interface CreatePaymentRecordInput {
  orderId: string;
  customerId: string | null;
  amount: Prisma.Decimal;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  paymentDate: Date;
  transactionReference: string;
}

/**
 * Finds an existing payment by Razorpay payment ID (idempotency check).
 */
export async function findPaymentByRazorpayPaymentId(
  razorpayPaymentId: string
): Promise<Payment | null> {
  return prisma.payment.findUnique({
    where: { razorpayPaymentId },
  });
}

/**
 * Resolves the order to update using internal ID or Razorpay order ID.
 */
export async function findOrderForPayment(params: {
  orderId?: string;
  razorpayOrderId: string;
}): Promise<OrderForPayment | null> {
  if (params.orderId) {
    return prisma.order.findUnique({
      where: { id: params.orderId },
      select: {
        id: true,
        userId: true,
        total: true,
        paymentMethod: true,
        razorpayOrderId: true,
        paymentStatus: true,
        status: true,
      },
    });
  }

  return prisma.order.findFirst({
    where: { razorpayOrderId: params.razorpayOrderId },
    select: {
      id: true,
      userId: true,
      total: true,
      paymentMethod: true,
      razorpayOrderId: true,
      paymentStatus: true,
      status: true,
    },
  });
}

/**
 * Atomically fulfills inventory, creates a payment record, and marks the order as paid.
 * Rolls back all operations if any step fails.
 */
export async function createPaymentAndMarkOrderPaid(
  paymentInput: CreatePaymentRecordInput
): Promise<{
  payment: Payment;
  order: Order;
  stockUpdates: StockUpdateResult[];
  inventoryUpdated: boolean;
}> {
  return prisma.$transaction(async (tx) => {
    const inventory = await fulfillOrderInventoryInTransaction(tx, paymentInput.orderId);

    const payment = await tx.payment.create({
      data: {
        orderId: paymentInput.orderId,
        customerId: paymentInput.customerId,
        amount: paymentInput.amount,
        currency: paymentInput.currency,
        method: paymentInput.method,
        status: paymentInput.status,
        razorpayOrderId: paymentInput.razorpayOrderId,
        razorpayPaymentId: paymentInput.razorpayPaymentId,
        razorpaySignature: paymentInput.razorpaySignature,
        paymentDate: paymentInput.paymentDate,
        transactionReference: paymentInput.transactionReference,
      },
    });

    const order = await tx.order.update({
      where: { id: paymentInput.orderId },
      data: {
        status: OrderStatus.PAID,
        paymentStatus: PaymentStatus.PAID,
        paymentCompletedAt: paymentInput.paymentDate,
        razorpayOrderId: paymentInput.razorpayOrderId,
        razorpayPaymentId: paymentInput.razorpayPaymentId,
        paymentMethod: paymentInput.method,
      },
    });

    return {
      payment,
      order,
      stockUpdates: inventory.stockUpdates,
      inventoryUpdated: inventory.inventoryUpdated,
    };
  });
}

/**
 * Ensures an already-processed payment still has its order marked as paid.
 */
export async function ensureOrderPaidForExistingPayment(
  orderId: string,
  razorpayOrderId: string,
  razorpayPaymentId: string,
  paymentMethod: PaymentMethod,
  paymentDate: Date
): Promise<Order> {
  return prisma.order.update({
    where: { id: orderId },
    data: {
      status: OrderStatus.PAID,
      paymentStatus: PaymentStatus.PAID,
      paymentCompletedAt: paymentDate,
      razorpayOrderId,
      razorpayPaymentId,
      paymentMethod,
    },
  });
}

/**
 * Marks an order and its payment as failed (webhook: payment.failed).
 */
export async function markOrderPaymentFailed(params: {
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
}): Promise<{ orderId: string | null; paymentId: string | null }> {
  const payment = params.razorpayPaymentId
    ? await prisma.payment.findUnique({
        where: { razorpayPaymentId: params.razorpayPaymentId },
        select: { id: true, orderId: true },
      })
    : null;

  const order =
    !payment && params.razorpayOrderId
      ? await prisma.order.findFirst({
          where: { razorpayOrderId: params.razorpayOrderId },
          select: { id: true },
        })
      : null;

  const orderId = payment?.orderId ?? order?.id ?? null;

  if (!orderId) {
    return { orderId: null, paymentId: null };
  }

  await prisma.$transaction(async (tx) => {
    if (payment) {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.FAILED },
      });
    }

    await tx.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.FAILED,
        paymentStatus: PaymentStatus.FAILED,
      },
    });
  });

  return { orderId, paymentId: payment?.id ?? null };
}

/**
 * Updates payment status by Razorpay payment ID.
 */
export async function updatePaymentStatusByRazorpayId(
  razorpayPaymentId: string,
  status: PaymentStatus
): Promise<Payment | null> {
  const payment = await prisma.payment.findUnique({
    where: { razorpayPaymentId },
  });

  if (!payment) return null;

  return prisma.payment.update({
    where: { id: payment.id },
    data: { status },
  });
}

/**
 * Records refund details on a payment and optionally updates order status.
 */
export async function applyPaymentRefund(params: {
  razorpayPaymentId: string;
  refundId: string;
  refundAmountPaise: number;
  processed: boolean;
}): Promise<{ orderId: string | null; paymentId: string | null }> {
  const payment = await prisma.payment.findUnique({
    where: { razorpayPaymentId: params.razorpayPaymentId },
    select: { id: true, orderId: true },
  });

  if (!payment) {
    return { orderId: null, paymentId: null };
  }

  const refundAmount = new Prisma.Decimal(params.refundAmountPaise / 100);

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        refundId: params.refundId,
        refundAmount,
        status: params.processed ? PaymentStatus.REFUNDED : PaymentStatus.PAID,
      },
    });

    if (params.processed) {
      await tx.order.update({
        where: { id: payment.orderId },
        data: {
          status: OrderStatus.REFUNDED,
          paymentStatus: PaymentStatus.REFUNDED,
        },
      });
    }
  });

  return { orderId: payment.orderId, paymentId: payment.id };
}
