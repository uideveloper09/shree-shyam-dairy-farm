/**
 * Server-only Razorpay SDK client (Step 1 — Live Payment Gateway integration).
 *
 * Import only from Route Handlers, Server Actions, Server Components, and other
 * server-only code. Never import this module from client components — the secret
 * key must never reach the browser bundle.
 */
import "server-only";

import Razorpay from "razorpay";

/** Public key ID — safe to expose to the client checkout script. */
const KEY_ID_ENV = "NEXT_PUBLIC_RAZORPAY_KEY_ID" as const;

/** Secret key — server-only; used to sign API requests to Razorpay. */
const KEY_SECRET_ENV = "RAZORPAY_KEY_SECRET" as const;

/**
 * Reads Razorpay credentials from `process.env` and validates that both are present.
 *
 * @throws {Error} When either variable is missing or empty.
 */
function resolveRazorpayCredentials(): Readonly<{ keyId: string; keySecret: string }> {
  const keyId = process.env[KEY_ID_ENV]?.trim();
  const keySecret = process.env[KEY_SECRET_ENV]?.trim();

  if (!keyId) {
    throw new Error(
      `Razorpay client misconfigured: ${KEY_ID_ENV} is not set. ` +
        "Add your live Razorpay key ID to .env.local."
    );
  }

  if (!keySecret) {
    throw new Error(
      `Razorpay client misconfigured: ${KEY_SECRET_ENV} is not set. ` +
        "Add your live Razorpay key secret to .env.local."
    );
  }

  return { keyId, keySecret };
}

/**
 * Instantiates the official Razorpay Node SDK with validated credentials.
 */
function createRazorpayClient(): Razorpay {
  const { keyId, keySecret } = resolveRazorpayCredentials();

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

/**
 * Reuse one SDK instance across hot reloads in development (Next.js HMR).
 * In production each server process holds a single instance.
 */
const globalForRazorpay = globalThis as typeof globalThis & {
  __razorpayClient?: Razorpay;
};

function getRazorpaySingleton(): Razorpay {
  if (globalForRazorpay.__razorpayClient) {
    return globalForRazorpay.__razorpayClient;
  }

  const client = createRazorpayClient();

  if (process.env.NODE_ENV !== "production") {
    globalForRazorpay.__razorpayClient = client;
  }

  return client;
}

/**
 * Shared Razorpay instance for server-side payment operations.
 *
 * Credentials are validated when this module is first imported. Subsequent imports
 * return the same instance.
 */
export const razorpay: Razorpay = getRazorpaySingleton();

export default razorpay;
