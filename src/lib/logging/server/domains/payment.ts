import "server-only";

import { createDomainChild } from "../core/domain-child";
import { serializeError } from "../../shared/serialize";
import type { PaymentLogMeta } from "../../shared/types";

const pino = createDomainChild("payment", "payment");

export const paymentLogger = {
  info(message: string, meta?: PaymentLogMeta) {
    pino().info(meta ?? {}, message);
  },
  warn(message: string, meta?: PaymentLogMeta) {
    pino().warn(meta ?? {}, message);
  },
  error(message: string, meta?: PaymentLogMeta) {
    pino().error(meta ?? {}, message);
  },
  initiated(meta: PaymentLogMeta) {
    pino().info(meta, "payment_initiated");
  },
  authorized(meta: PaymentLogMeta) {
    pino().info(meta, "payment_authorized");
  },
  captured(meta: PaymentLogMeta) {
    pino().info(meta, "payment_captured");
  },
  failed(meta: PaymentLogMeta & { error?: unknown }) {
    const { error, ...rest } = meta;
    pino().error({ ...rest, ...(error ? { err: serializeError(error) } : {}) }, "payment_failed");
  },
  refunded(meta: PaymentLogMeta) {
    pino().info(meta, "payment_refunded");
  },
  webhookReceived(provider: string, event: string, meta?: PaymentLogMeta) {
    pino().info({ provider, event, ...meta }, "payment_webhook_received");
  },
  webhookProcessed(provider: string, event: string, meta?: PaymentLogMeta) {
    pino().info({ provider, event, ...meta }, "payment_webhook_processed");
  },
  webhookFailed(provider: string, event: string, error: unknown, meta?: PaymentLogMeta) {
    pino().error(
      { provider, event, err: serializeError(error), ...meta },
      "payment_webhook_failed"
    );
  },
};
