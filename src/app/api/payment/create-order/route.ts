/**
 * POST /api/payment/create-order
 *
 * Creates a Razorpay order server-side using the shared SDK client from
 * `@/lib/razorpay`. The secret key never leaves the server and is not
 * included in any response.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { paymentLogger } from "@/lib/logging/payment";
import type {
  CreateOrderErrorResponse,
  CreateOrderSuccessResponse,
  CreateOrderSummary,
  ParsedCreateOrderPayload,
  RazorpayApiError,
  RazorpayOrderEntity,
} from "./types";

/** Payment routes depend on live env credentials — never statically cache. */
export const dynamic = "force-dynamic";

const RECEIPT_MAX_LENGTH = 40;
const ISO_CURRENCY_PATTERN = /^[A-Z]{3}$/;

/** Currencies where the request `amount` is in major units (e.g. rupees, not paise). */
const MAJOR_UNIT_CURRENCIES = new Set(["INR"]);

/**
 * Type guard for errors thrown by the Razorpay Node SDK.
 */
function isRazorpayApiError(error: unknown): error is RazorpayApiError {
  if (typeof error !== "object" || error === null) return false;
  const candidate = error as Partial<RazorpayApiError>;
  return (
    typeof candidate.statusCode === "number" &&
    typeof candidate.error === "object" &&
    candidate.error !== null &&
    typeof candidate.error.description === "string"
  );
}

/**
 * Detects misconfiguration errors raised when importing `@/lib/razorpay`.
 */
function isRazorpayConfigError(error: unknown): boolean {
  return error instanceof Error && error.message.includes("Razorpay client misconfigured");
}

/**
 * Converts a major-unit amount to the smallest currency unit Razorpay expects.
 * For INR, ₹500 → 50000 paise.
 */
function toSmallestCurrencyUnit(amount: number, currency: string): number {
  if (MAJOR_UNIT_CURRENCIES.has(currency)) {
    return Math.round(amount * 100);
  }
  return Math.round(amount);
}

/**
 * Maps the full Razorpay order to the public response shape.
 */
function toOrderSummary(order: RazorpayOrderEntity): CreateOrderSummary {
  return {
    id: order.id,
    amount: order.amount,
    currency: order.currency,
    status: order.status,
    receipt: order.receipt ?? "",
  };
}

/**
 * Validates and normalizes the JSON request body.
 *
 * @throws {Error} With a client-safe message when validation fails.
 */
function parseCreateOrderBody(body: unknown): ParsedCreateOrderPayload {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new Error("Request body must be a JSON object");
  }

  const raw = body as Record<string, unknown>;
  const { amount, currency, receipt, notes } = raw;

  if (amount === undefined || amount === null) {
    throw new Error("amount is required");
  }

  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    throw new Error("amount must be a number greater than 0");
  }

  if (currency === undefined || typeof currency !== "string" || !currency.trim()) {
    throw new Error("currency is required");
  }

  const normalizedCurrency = currency.trim().toUpperCase();
  if (!ISO_CURRENCY_PATTERN.test(normalizedCurrency)) {
    throw new Error("currency must be a 3-letter ISO 4217 code (e.g. INR)");
  }

  if (receipt === undefined || typeof receipt !== "string") {
    throw new Error("receipt is required");
  }

  const normalizedReceipt = receipt.trim();
  if (!normalizedReceipt) {
    throw new Error("receipt cannot be empty");
  }

  if (normalizedReceipt.length > RECEIPT_MAX_LENGTH) {
    throw new Error(`receipt must be at most ${RECEIPT_MAX_LENGTH} characters`);
  }

  let normalizedNotes: Record<string, string> | undefined;
  if (notes !== undefined) {
    if (typeof notes !== "object" || notes === null || Array.isArray(notes)) {
      throw new Error("notes must be an object of string key-value pairs");
    }

    normalizedNotes = {};
    for (const [key, value] of Object.entries(notes as Record<string, unknown>)) {
      if (typeof value !== "string" && typeof value !== "number") {
        throw new Error(`notes.${key} must be a string or number`);
      }
      normalizedNotes[key] = String(value);
    }
  }

  let normalizedOrderId: string | undefined;
  if (raw.orderId !== undefined) {
    if (typeof raw.orderId !== "string" || !raw.orderId.trim()) {
      throw new Error("orderId must be a non-empty string when provided");
    }
    normalizedOrderId = raw.orderId.trim();
  }

  const amountInSubunits = toSmallestCurrencyUnit(amount, normalizedCurrency);
  if (amountInSubunits <= 0) {
    throw new Error("amount must convert to a positive value in the smallest currency unit");
  }

  return {
    amount: amountInSubunits,
    currency: normalizedCurrency,
    receipt: normalizedReceipt,
    notes: normalizedNotes,
    orderId: normalizedOrderId,
  };
}

/**
 * Maps Razorpay gateway errors to HTTP responses without leaking secrets.
 */
function razorpayErrorResponse(error: RazorpayApiError): NextResponse<CreateOrderErrorResponse> {
  const { statusCode, error: rzError } = error;

  paymentLogger.failed({
    provider: "razorpay",
    action: "create_order",
    error,
    code: rzError.code,
  });

  // Authentication failures indicate bad server credentials — never echo details to clients.
  if (statusCode === 401 || statusCode === 403) {
    return NextResponse.json(
      {
        success: false,
        error: "Payment gateway is not available. Please try again later.",
      },
      { status: 503 }
    );
  }

  const clientStatus = statusCode >= 400 && statusCode < 500 ? statusCode : 502;

  return NextResponse.json(
    {
      success: false,
      error: rzError.description || "Payment gateway rejected the order request",
      code: rzError.code,
      field: rzError.field,
    },
    { status: clientStatus }
  );
}

/**
 * Creates a Razorpay order via the shared server-only SDK client.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" } satisfies CreateOrderErrorResponse,
      { status: 400 }
    );
  }

  let payload: ParsedCreateOrderPayload;
  try {
    payload = parseCreateOrderBody(body);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid request body";
    return NextResponse.json(
      { success: false, error: message } satisfies CreateOrderErrorResponse,
      { status: 400 }
    );
  }

  let razorpay: (typeof import("@/lib/razorpay"))["razorpay"];
  try {
    ({ razorpay } = await import("@/lib/razorpay"));
  } catch (err) {
    paymentLogger.error("razorpay_client_unavailable", {
      provider: "razorpay",
      action: "create_order",
      error: err,
    });

    if (isRazorpayConfigError(err)) {
      return NextResponse.json(
        {
          success: false,
          error: "Payment gateway is not configured",
        } satisfies CreateOrderErrorResponse,
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Payment gateway is not available",
      } satisfies CreateOrderErrorResponse,
      { status: 503 }
    );
  }

  try {
    const order = (await razorpay.orders.create({
      amount: payload.amount,
      currency: payload.currency,
      receipt: payload.receipt,
      ...(payload.notes ? { notes: payload.notes } : {}),
    })) as RazorpayOrderEntity;

    paymentLogger.initiated({
      provider: "razorpay",
      action: "create_order",
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });

    if (payload.orderId) {
      const { isDatabaseConfigured, prisma } = await import("@/repositories/prisma");
      if (isDatabaseConfigured()) {
        await prisma.order.update({
          where: { id: payload.orderId },
          data: { razorpayOrderId: order.id },
        });
      }
    }

    return NextResponse.json(
      {
        success: true,
        order: toOrderSummary(order),
      } satisfies CreateOrderSuccessResponse,
      { status: 201 }
    );
  } catch (err) {
    if (isRazorpayApiError(err)) {
      return razorpayErrorResponse(err);
    }

    paymentLogger.failed({
      provider: "razorpay",
      action: "create_order",
      error: err,
    });

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create payment order",
      } satisfies CreateOrderErrorResponse,
      { status: 500 }
    );
  }
}
