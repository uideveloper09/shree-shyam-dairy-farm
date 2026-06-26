/**
 * POST /api/payment/webhook
 *
 * Secure Razorpay storefront webhook endpoint (Step 6).
 * Verifies HMAC SHA-256 signatures, audits every event, and processes
 * payment lifecycle updates idempotently.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { paymentLogger } from "@/lib/logging/payment";
import {
  getRazorpaySignatureHeader,
  getRazorpayWebhookSecret,
  verifyRazorpayWebhookSignature,
} from "@/lib/payment/razorpay-webhook-signature";
import { processRazorpayWebhook } from "@/services/payment/razorpay-webhook.service";
import type { RazorpayWebhookErrorResponse, RazorpayWebhookSuccessResponse } from "./types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Handles inbound Razorpay webhook POST requests.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  let rawBody: string;

  try {
    rawBody = await request.text();
  } catch (error) {
    paymentLogger.webhookFailed("razorpay", "unknown", error, {
      provider: "razorpay",
      action: "webhook_read_body",
    });

    return NextResponse.json(
      {
        success: false,
        error: "Could not read request body",
      } satisfies RazorpayWebhookErrorResponse,
      { status: 400 }
    );
  }

  const providedSignature = getRazorpaySignatureHeader(request);

  if (!providedSignature) {
    paymentLogger.webhookFailed(
      "razorpay",
      "unknown",
      new Error("Missing x-razorpay-signature header"),
      { provider: "razorpay", action: "webhook_missing_signature" }
    );

    return NextResponse.json(
      { success: false, error: "Missing webhook signature" } satisfies RazorpayWebhookErrorResponse,
      { status: 401 }
    );
  }

  let webhookSecret: string;
  try {
    webhookSecret = getRazorpayWebhookSecret();
  } catch (error) {
    paymentLogger.webhookFailed("razorpay", "unknown", error, {
      provider: "razorpay",
      action: "webhook_secret_missing",
    });

    return NextResponse.json(
      { success: false, error: "Webhook is not configured" } satisfies RazorpayWebhookErrorResponse,
      { status: 503 }
    );
  }

  const signatureValid = verifyRazorpayWebhookSignature(rawBody, providedSignature, webhookSecret);

  if (!signatureValid) {
    paymentLogger.webhookFailed("razorpay", "unknown", new Error("Invalid webhook signature"), {
      provider: "razorpay",
      action: "webhook_invalid_signature",
    });

    return NextResponse.json(
      { success: false, error: "Invalid webhook signature" } satisfies RazorpayWebhookErrorResponse,
      { status: 401 }
    );
  }

  try {
    await processRazorpayWebhook(rawBody);

    return NextResponse.json({ success: true } satisfies RazorpayWebhookSuccessResponse, {
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook processing failed";

    paymentLogger.webhookFailed("razorpay", "unknown", error, {
      provider: "razorpay",
      action: "webhook_handler_error",
    });

    return NextResponse.json(
      { success: false, error: message } satisfies RazorpayWebhookErrorResponse,
      { status: 500 }
    );
  }
}
