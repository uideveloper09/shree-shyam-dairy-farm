import { createHmac, timingSafeEqual } from "node:crypto";

const SIGNATURE_HEADER = "x-razorpay-signature" as const;
const WEBHOOK_SECRET_ENV = "RAZORPAY_WEBHOOK_SECRET" as const;

/**
 * Reads the Razorpay webhook signing secret from the server environment.
 */
export function getRazorpayWebhookSecret(): string {
  const secret = process.env[WEBHOOK_SECRET_ENV]?.trim();
  if (!secret) {
    throw new Error("Razorpay webhook secret is not configured");
  }
  return secret;
}

/**
 * Returns the Razorpay webhook signature header value, if present.
 */
export function getRazorpaySignatureHeader(request: Request): string | null {
  const signature = request.headers.get(SIGNATURE_HEADER);
  return signature?.trim() || null;
}

/**
 * Computes the expected HMAC SHA-256 signature for a raw webhook body.
 */
export function computeRazorpayWebhookSignature(rawBody: string, webhookSecret: string): string {
  return createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
}

/**
 * Verifies the Razorpay webhook signature using constant-time comparison.
 */
export function verifyRazorpayWebhookSignature(
  rawBody: string,
  providedSignature: string,
  webhookSecret: string
): boolean {
  const expected = computeRazorpayWebhookSignature(rawBody, webhookSecret);
  const expectedBuffer = Buffer.from(expected, "utf8");
  const providedBuffer = Buffer.from(providedSignature, "utf8");

  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, providedBuffer);
}
