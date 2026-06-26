import type { LogLevel } from "@/config/logging";

export type { LogLevel };

/** Structured metadata attached to log entries. */
export type LogMeta = Record<string, unknown>;

export type LogDomain = "app" | "api" | "database" | "payment" | "audit" | "request" | "error";

export type SerializedError = {
  name: string;
  message: string;
  stack?: string;
  code?: string;
  cause?: unknown;
};

export type RequestLogMeta = LogMeta & {
  method: string;
  path: string;
  status: number;
  durationMs: number;
  requestId?: string;
  tenantId?: string;
  userId?: string;
};

export type AuditLogMeta = LogMeta & {
  action: string;
  userId?: string | null;
  actorId?: string | null;
  resource?: string;
  resourceId?: string;
  severity?: "info" | "warn" | "critical";
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type DatabaseLogMeta = LogMeta & {
  operation?: string;
  model?: string;
  durationMs?: number;
  query?: string;
};

export type PaymentLogMeta = LogMeta & {
  provider?: "razorpay" | "stripe" | string;
  orderId?: string;
  paymentId?: string;
  amount?: number;
  currency?: string;
  tenantId?: string;
  status?: string;
};
