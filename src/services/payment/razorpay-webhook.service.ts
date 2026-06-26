/**
 * Razorpay storefront webhook processing service.
 */
import { createHash } from "node:crypto";
import { PaymentMethod, PaymentStatus } from "@prisma/client";
import { paymentLogger } from "@/lib/logging/payment";
import {
  applyPaymentRefund,
  markOrderPaymentFailed,
  updatePaymentStatusByRazorpayId,
} from "@/repositories/payment.repository";
import {
  createWebhookEventRecord,
  findWebhookEventByEventId,
  markWebhookEventProcessed,
} from "@/repositories/razorpay-webhook.repository";
import { isDatabaseConfigured } from "@/repositories/prisma";
import { parsePaymentMethod, persistVerifiedPayment } from "./razorpay-payment.service";
import { OrderNotFoundForPaymentError, PaymentPersistenceError } from "./types";
import type {
  ParsedRazorpayWebhookEvent,
  ProcessWebhookResult,
  RazorpayPaymentEntity,
  RazorpayWebhookEventBody,
  RazorpayWebhookEventType,
  RazorpayWebhookPayload,
} from "./razorpay-webhook.types";
import { RAZORPAY_WEBHOOK_EVENTS } from "./razorpay-webhook.types";

const WEBHOOK_SIGNATURE_MARKER = "webhook" as const;

function isSupportedEventType(value: string): value is RazorpayWebhookEventType {
  return (RAZORPAY_WEBHOOK_EVENTS as readonly string[]).includes(value);
}

/**
 * Parses and validates the Razorpay webhook JSON body.
 */
export function parseRazorpayWebhookBody(
  rawBody: string
): { ok: true; event: ParsedRazorpayWebhookEvent } | { ok: false; error: string } {
  let body: unknown;

  try {
    body = JSON.parse(rawBody) as unknown;
  } catch {
    return { ok: false, error: "Invalid JSON body" };
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { ok: false, error: "Webhook body must be a JSON object" };
  }

  const raw = body as RazorpayWebhookEventBody;

  if (typeof raw.event !== "string" || !raw.event.trim()) {
    return { ok: false, error: "Missing webhook event type" };
  }

  if (typeof raw.payload !== "object" || raw.payload === null) {
    return { ok: false, error: "Missing webhook payload" };
  }

  const eventType = raw.event.trim();
  const eventId = extractEventId(raw, rawBody);

  return {
    ok: true,
    event: {
      eventId,
      eventType,
      payload: raw.payload,
      raw,
    },
  };
}

/**
 * Derives a stable idempotency key for a webhook event.
 */
export function extractEventId(event: RazorpayWebhookEventBody, rawBody: string): string {
  if (typeof event.id === "string" && event.id.trim()) {
    return event.id.trim();
  }

  const entityId = extractPrimaryEntityId(event.event, event.payload);
  if (entityId) {
    return `${event.event}:${entityId}`;
  }

  return createHash("sha256").update(rawBody).digest("hex");
}

function extractPrimaryEntityId(eventType: string, payload: RazorpayWebhookPayload): string | null {
  if (eventType.startsWith("payment.") && payload.payment?.entity?.id) {
    return payload.payment.entity.id;
  }

  if (eventType.startsWith("refund.") && payload.refund?.entity?.id) {
    return payload.refund.entity.id;
  }

  if (eventType === "order.paid" && payload.order?.entity?.id) {
    return payload.order.entity.id;
  }

  return null;
}

function mapRazorpayMethod(method: string | undefined): PaymentMethod | undefined {
  if (!method) return undefined;

  const normalized = method.trim().toUpperCase();
  if (normalized === "CARD") return PaymentMethod.CARD;
  if (normalized === "NETBANKING") return PaymentMethod.NETBANKING;
  if (normalized === "WALLET") return PaymentMethod.WALLET;
  if (normalized === "UPI") return PaymentMethod.UPI;

  return parsePaymentMethod(normalized);
}

function paiseToMajor(amountPaise: number): number {
  return amountPaise / 100;
}

async function handlePaymentAuthorized(payment: RazorpayPaymentEntity): Promise<void> {
  const updated = await updatePaymentStatusByRazorpayId(payment.id, PaymentStatus.AUTHORIZED);

  paymentLogger.authorized({
    provider: "razorpay",
    action: "webhook_payment_authorized",
    paymentId: payment.id,
    orderId: payment.order_id,
    status: updated ? PaymentStatus.AUTHORIZED : "no_local_payment_record",
  });
}

async function handlePaymentCaptured(payment: RazorpayPaymentEntity): Promise<void> {
  try {
    const result = await persistVerifiedPayment({
      razorpayOrderId: payment.order_id,
      razorpayPaymentId: payment.id,
      razorpaySignature: WEBHOOK_SIGNATURE_MARKER,
      amount: paiseToMajor(payment.amount),
      currency: payment.currency,
      paymentMethod: mapRazorpayMethod(payment.method),
    });

    paymentLogger.captured({
      provider: "razorpay",
      action: "webhook_payment_captured",
      orderId: result.orderId,
      paymentId: payment.id,
      amount: paiseToMajor(payment.amount),
      currency: payment.currency,
      status: PaymentStatus.PAID,
      alreadyProcessed: result.alreadyProcessed,
    });
  } catch (error) {
    if (error instanceof OrderNotFoundForPaymentError) {
      paymentLogger.warn("razorpay_webhook_order_not_found", {
        provider: "razorpay",
        action: "webhook_payment_captured",
        paymentId: payment.id,
        orderId: payment.order_id,
      });
      return;
    }

    throw error;
  }
}

async function handlePaymentFailed(payment: RazorpayPaymentEntity): Promise<void> {
  const result = await markOrderPaymentFailed({
    razorpayOrderId: payment.order_id,
    razorpayPaymentId: payment.id,
  });

  paymentLogger.failed({
    provider: "razorpay",
    action: "webhook_payment_failed",
    orderId: result.orderId ?? payment.order_id,
    paymentId: payment.id,
    error: payment.error_description ?? payment.error_code ?? "payment_failed",
  });
}

async function handleOrderPaid(payload: RazorpayWebhookPayload): Promise<void> {
  const payment = payload.payment?.entity;

  if (payment?.status === "captured") {
    await handlePaymentCaptured(payment);
    return;
  }

  paymentLogger.info("razorpay_webhook_order_paid_acknowledged", {
    provider: "razorpay",
    action: "webhook_order_paid",
    orderId: payload.order?.entity?.id,
  });
}

async function handleRefundCreated(refund: {
  id: string;
  payment_id: string;
  amount: number;
}): Promise<void> {
  const result = await applyPaymentRefund({
    razorpayPaymentId: refund.payment_id,
    refundId: refund.id,
    refundAmountPaise: refund.amount,
    processed: false,
  });

  paymentLogger.refunded({
    provider: "razorpay",
    action: "webhook_refund_created",
    orderId: result.orderId ?? undefined,
    paymentId: refund.payment_id,
    amount: paiseToMajor(refund.amount),
  });
}

async function handleRefundProcessed(refund: {
  id: string;
  payment_id: string;
  amount: number;
}): Promise<void> {
  const result = await applyPaymentRefund({
    razorpayPaymentId: refund.payment_id,
    refundId: refund.id,
    refundAmountPaise: refund.amount,
    processed: true,
  });

  paymentLogger.refunded({
    provider: "razorpay",
    action: "webhook_refund_processed",
    orderId: result.orderId ?? undefined,
    paymentId: refund.payment_id,
    amount: paiseToMajor(refund.amount),
    status: PaymentStatus.REFUNDED,
  });
}

async function dispatchWebhookEvent(event: ParsedRazorpayWebhookEvent): Promise<void> {
  if (!isSupportedEventType(event.eventType)) {
    paymentLogger.info("razorpay_webhook_unhandled_event", {
      provider: "razorpay",
      action: "webhook_unhandled",
      eventId: event.eventId,
      event: event.eventType,
    });
    return;
  }

  switch (event.eventType) {
    case "payment.authorized": {
      const payment = event.payload.payment?.entity;
      if (payment) await handlePaymentAuthorized(payment);
      break;
    }
    case "payment.captured": {
      const payment = event.payload.payment?.entity;
      if (!payment) throw new PaymentPersistenceError("Missing payment entity in webhook payload");
      await handlePaymentCaptured(payment);
      break;
    }
    case "payment.failed": {
      const payment = event.payload.payment?.entity;
      if (!payment) throw new PaymentPersistenceError("Missing payment entity in webhook payload");
      await handlePaymentFailed(payment);
      break;
    }
    case "order.paid":
      await handleOrderPaid(event.payload);
      break;
    case "refund.created": {
      const refund = event.payload.refund?.entity;
      if (!refund) throw new PaymentPersistenceError("Missing refund entity in webhook payload");
      await handleRefundCreated(refund);
      break;
    }
    case "refund.processed": {
      const refund = event.payload.refund?.entity;
      if (!refund) throw new PaymentPersistenceError("Missing refund entity in webhook payload");
      await handleRefundProcessed(refund);
      break;
    }
  }
}

/**
 * Processes an inbound Razorpay webhook with idempotent audit logging.
 */
export async function processRazorpayWebhook(rawBody: string): Promise<ProcessWebhookResult> {
  if (!isDatabaseConfigured()) {
    throw new PaymentPersistenceError("Database is not configured");
  }

  const parsed = parseRazorpayWebhookBody(rawBody);
  if (!parsed.ok) {
    throw new Error(parsed.error);
  }

  const { event } = parsed;

  paymentLogger.webhookReceived("razorpay", event.eventType, {
    provider: "razorpay",
    action: "webhook_received",
    eventId: event.eventId,
  });

  const existing = await findWebhookEventByEventId(event.eventId);
  if (existing?.processed) {
    paymentLogger.webhookProcessed("razorpay", event.eventType, {
      provider: "razorpay",
      action: "webhook_duplicate_ignored",
      eventId: event.eventId,
    });

    return {
      duplicate: true,
      processed: true,
      eventType: event.eventType,
      eventId: event.eventId,
    };
  }

  if (!existing) {
    const created = await createWebhookEventRecord({
      eventId: event.eventId,
      eventType: event.eventType,
      payload: event.raw as object,
    });

    if (!created) {
      const raced = await findWebhookEventByEventId(event.eventId);
      if (raced?.processed) {
        return {
          duplicate: true,
          processed: true,
          eventType: event.eventType,
          eventId: event.eventId,
        };
      }
    }
  }

  try {
    await dispatchWebhookEvent(event);
    await markWebhookEventProcessed(event.eventId);

    paymentLogger.webhookProcessed("razorpay", event.eventType, {
      provider: "razorpay",
      action: "webhook_processed",
      eventId: event.eventId,
    });

    return {
      duplicate: false,
      processed: true,
      eventType: event.eventType,
      eventId: event.eventId,
    };
  } catch (error) {
    paymentLogger.webhookFailed("razorpay", event.eventType, error, {
      provider: "razorpay",
      action: "webhook_processing_failed",
      eventId: event.eventId,
    });
    throw error;
  }
}
