/**
 * POST /api/payment/verify
 *
 * Verifies a Razorpay payment signature server-side using HMAC SHA-256, then
 * persists the payment and marks the order as paid inside a database transaction.
 * The secret key is read from process.env.RAZORPAY_KEY_SECRET and is never
 * included in any API response.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { paymentLogger } from "@/lib/logging/payment";
import {
  parsePaymentMethod,
  persistVerifiedPayment,
} from "@/services/payment/razorpay-payment.service";
import { OrderNotFoundForPaymentError, PaymentPersistenceError } from "@/services/payment/types";
import { InsufficientInventoryError } from "@/services/inventory/types";
import type {
  VerifyPaymentFailureResponse,
  VerifyPaymentRequestBody,
  VerifyPaymentSuccessResponse,
} from "./types";

/** Payment routes depend on live env credentials — never statically cache. */
export const dynamic = "force-dynamic";

const KEY_SECRET_ENV = "RAZORPAY_KEY_SECRET" as const;

/**
 * Validates the verify-payment request body.
 *
 * @throws {Error} With a client-safe message when a required field is missing.
 */
function parseVerifyPaymentBody(body: unknown): VerifyPaymentRequestBody {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new Error("Request body must be a JSON object");
  }

  const raw = body as Record<string, unknown>;
  const qrPayment = raw.qr_payment === true;
  const razorpay_payment_id = raw.razorpay_payment_id;
  const razorpay_order_id = raw.razorpay_order_id;
  const razorpay_signature = raw.razorpay_signature;

  if (typeof razorpay_payment_id !== "string" || !razorpay_payment_id.trim()) {
    throw new Error("razorpay_payment_id is required");
  }

  if (typeof razorpay_order_id !== "string" || !razorpay_order_id.trim()) {
    throw new Error("razorpay_order_id is required");
  }

  if (!qrPayment) {
    if (typeof razorpay_signature !== "string" || !razorpay_signature.trim()) {
      throw new Error("razorpay_signature is required");
    }
  }

  const parsed: VerifyPaymentRequestBody = {
    razorpay_payment_id: razorpay_payment_id.trim(),
    razorpay_order_id: razorpay_order_id.trim(),
    razorpay_signature: typeof razorpay_signature === "string" ? razorpay_signature.trim() : "",
    qr_payment: qrPayment || undefined,
  };

  if (typeof raw.orderId === "string" && raw.orderId.trim()) {
    parsed.orderId = raw.orderId.trim();
  }

  if (typeof raw.customerId === "string" && raw.customerId.trim()) {
    parsed.customerId = raw.customerId.trim();
  }

  if (typeof raw.amount === "number" && Number.isFinite(raw.amount) && raw.amount > 0) {
    parsed.amount = raw.amount;
  }

  if (typeof raw.currency === "string" && raw.currency.trim()) {
    parsed.currency = raw.currency.trim();
  }

  const paymentMethod = parsePaymentMethod(raw.paymentMethod);
  if (paymentMethod) {
    parsed.paymentMethod = paymentMethod;
  }

  return parsed;
}

/**
 * Reads the Razorpay secret from the server environment.
 * Never returned to clients.
 */
function getRazorpayKeySecret(): string {
  const secret = process.env[KEY_SECRET_ENV]?.trim();
  if (!secret) {
    throw new Error("Payment gateway secret is not configured");
  }
  return secret;
}

/**
 * Generates the expected Razorpay payment signature.
 *
 * @see https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/#step-5-verify-payment-signature
 */
function generateExpectedSignature(orderId: string, paymentId: string, secret: string): string {
  return createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
}

/**
 * Compares signatures in constant time to reduce timing-attack risk.
 */
function isSignatureValid(expected: string, provided: string): boolean {
  const expectedBuffer = Buffer.from(expected, "utf8");
  const providedBuffer = Buffer.from(provided, "utf8");

  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, providedBuffer);
}

/**
 * Verifies that the payment signature matches Razorpay's HMAC SHA-256 output.
 */
function verifyRazorpayPaymentSignature(
  payload: Pick<
    VerifyPaymentRequestBody,
    "razorpay_order_id" | "razorpay_payment_id" | "razorpay_signature"
  >,
  secret: string
): boolean {
  const expectedSignature = generateExpectedSignature(
    payload.razorpay_order_id,
    payload.razorpay_payment_id,
    secret
  );

  return isSignatureValid(expectedSignature, payload.razorpay_signature);
}

/**
 * Verifies a QR / payment-link payment by fetching status from Razorpay server-side.
 */
async function verifyQrPaymentServerSide(
  payload: Pick<VerifyPaymentRequestBody, "razorpay_order_id" | "razorpay_payment_id">
): Promise<boolean> {
  const { razorpay } = await import("@/lib/razorpay");
  const payment = (await razorpay.payments.fetch(payload.razorpay_payment_id)) as {
    status?: string;
    order_id?: string | null;
  };

  return (
    payment.status === "captured" &&
    (!payment.order_id || payment.order_id === payload.razorpay_order_id)
  );
}

/**
 * Verifies a Razorpay payment and persists it when the signature is valid.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        verified: false,
        message: "Invalid JSON body",
      } satisfies VerifyPaymentFailureResponse,
      { status: 400 }
    );
  }

  let payload: VerifyPaymentRequestBody;
  try {
    payload = parseVerifyPaymentBody(body);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid request body";
    return NextResponse.json(
      {
        success: false,
        verified: false,
        message,
      } satisfies VerifyPaymentFailureResponse,
      { status: 400 }
    );
  }

  try {
    const secret = getRazorpayKeySecret();
    const isValid = payload.qr_payment
      ? await verifyQrPaymentServerSide(payload)
      : verifyRazorpayPaymentSignature(payload, secret);

    if (!isValid) {
      paymentLogger.failed({
        provider: "razorpay",
        action: "verify_payment",
        orderId: payload.orderId,
        paymentId: payload.razorpay_payment_id,
        error: new Error("Invalid payment signature"),
      });

      return NextResponse.json(
        {
          success: false,
          verified: false,
          message: "Invalid payment signature.",
        } satisfies VerifyPaymentFailureResponse,
        { status: 401 }
      );
    }

    const persistence = await persistVerifiedPayment({
      orderId: payload.orderId,
      customerId: payload.customerId,
      razorpayOrderId: payload.razorpay_order_id,
      razorpayPaymentId: payload.razorpay_payment_id,
      razorpaySignature: payload.razorpay_signature,
      amount: payload.amount,
      currency: payload.currency,
      paymentMethod: payload.paymentMethod,
    });

    return NextResponse.json(
      {
        success: true,
        verified: true,
        message: persistence.alreadyProcessed
          ? "Payment was already processed."
          : "Payment verified successfully.",
        paymentSaved: true,
        orderUpdated: true,
        inventory: {
          updated: persistence.inventoryUpdated,
          items: persistence.stockUpdates,
        },
        ...(persistence.invoice ? { invoice: persistence.invoice } : {}),
        notificationsSent: persistence.notificationsSent,
        ...(persistence.alreadyProcessed ? { alreadyProcessed: true } : {}),
      } satisfies VerifyPaymentSuccessResponse,
      { status: 200 }
    );
  } catch (err) {
    if (err instanceof InsufficientInventoryError) {
      return NextResponse.json(
        {
          success: false,
          verified: true,
          message: err.message,
          paymentSaved: false,
          orderUpdated: false,
          orderCancelled: true,
          inventory: {
            updated: false,
            insufficientItems: err.items,
          },
        } satisfies VerifyPaymentFailureResponse,
        { status: 409 }
      );
    }

    if (err instanceof OrderNotFoundForPaymentError) {
      return NextResponse.json(
        {
          success: false,
          verified: true,
          message: err.message,
          paymentSaved: false,
          orderUpdated: false,
        },
        { status: 404 }
      );
    }

    if (err instanceof PaymentPersistenceError) {
      paymentLogger.failed({
        provider: "razorpay",
        action: "verify_payment",
        orderId: payload.orderId,
        paymentId: payload.razorpay_payment_id,
        error: err,
      });

      return NextResponse.json(
        {
          success: false,
          verified: true,
          message: err.message,
          paymentSaved: false,
          orderUpdated: false,
        },
        { status: 500 }
      );
    }

    paymentLogger.failed({
      provider: "razorpay",
      action: "verify_payment",
      orderId: payload.orderId,
      paymentId: payload.razorpay_payment_id,
      error: err,
    });

    return NextResponse.json(
      {
        success: false,
        verified: false,
        message: "Payment verification failed",
      } satisfies VerifyPaymentFailureResponse,
      { status: 500 }
    );
  }
}
