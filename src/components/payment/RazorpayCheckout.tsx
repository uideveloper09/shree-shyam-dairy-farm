"use client";

/**
 * Reusable Razorpay Checkout button (Step 3 — frontend payment flow).
 *
 * Creates an order via POST /api/payment/create-order, then opens the official
 * Razorpay Checkout modal. Only the public key ID is used client-side; the
 * secret key never leaves the server.
 */
import { useCallback, useState } from "react";
import { Loader2 } from "lucide-react";
import type {
  CreateOrderErrorResponse,
  CreateOrderRequestBody,
  CreateOrderSuccessResponse,
} from "@/app/api/payment/create-order/types";
import type { VerifyPaymentSuccessResponse } from "@/app/api/payment/verify/types";
import type { RazorpayPaymentSuccessResponse } from "@/types/razorpay-checkout";
import { verifyPaymentOnServer } from "@/lib/payment/verify-payment-client";

/** Official Razorpay Checkout script — loaded on demand. */
const RAZORPAY_CHECKOUT_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js" as const;

const DEFAULT_THEME_COLOR = "#082F63";

/** Customer details pre-filled in the Razorpay modal. */
export interface RazorpayCustomerDetails {
  name: string;
  email: string;
  contact: string;
}

export interface RazorpayCheckoutProps {
  /** Amount in major currency units (e.g. rupees for INR). */
  amount: number;
  /** ISO currency code. Defaults to INR. */
  currency?: string;
  /** Unique merchant receipt reference sent to the create-order API. */
  receipt: string;
  /** Optional metadata attached to the Razorpay order. */
  notes?: Record<string, string>;
  /** Internal database order ID (from POST /api/v1/orders/checkout). */
  internalOrderId?: string;
  /** Business name shown on the Razorpay checkout screen. */
  merchantName: string;
  /** Short description shown below the merchant name. */
  description?: string;
  /** Customer name, email, and phone pre-filled in checkout. */
  customer: RazorpayCustomerDetails;
  /** Razorpay modal accent color. */
  themeColor?: string;
  /** Button label. Defaults to "Pay Now". */
  buttonLabel?: string;
  /** Extra Tailwind classes for the button. */
  className?: string;
  /** Disables the button regardless of processing state. */
  disabled?: boolean;
  /** Called after payment is verified and persisted server-side. */
  onPaymentSuccess?: (
    response: RazorpayPaymentSuccessResponse,
    verifyResult: VerifyPaymentSuccessResponse
  ) => void;
  /** Called when payment fails or the flow errors. */
  onPaymentFailed?: (message: string) => void;
  /** Called when the user closes the Razorpay modal without paying. */
  onDismiss?: () => void;
}

interface PaymentConfigResponse {
  configured: boolean;
  keyId: string | null;
}

type CheckoutPhase = "idle" | "loading" | "verifying";

/**
 * Dynamically injects the Razorpay Checkout script if it is not already present.
 */
function loadRazorpayCheckoutScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }

    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${RAZORPAY_CHECKOUT_SCRIPT_URL}"]`
    );

    if (existing) {
      existing.addEventListener("load", () => resolve(Boolean(window.Razorpay)));
      existing.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");
    script.src = RAZORPAY_CHECKOUT_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function isCreateOrderSuccess(
  data: CreateOrderSuccessResponse | CreateOrderErrorResponse
): data is CreateOrderSuccessResponse {
  return data.success === true;
}

/**
 * Fetches the public Razorpay key ID from the server config endpoint.
 * Never returns or accepts the secret key.
 */
async function fetchPublicRazorpayKey(): Promise<string> {
  const response = await fetch("/api/payment/config");
  const data = (await response.json()) as PaymentConfigResponse;

  if (!response.ok || !data.configured || !data.keyId) {
    throw new Error("Payment gateway is not configured");
  }

  return data.keyId;
}

/**
 * Creates a Razorpay order through the server API.
 */
async function createRazorpayOrder(
  body: CreateOrderRequestBody
): Promise<CreateOrderSuccessResponse["order"]> {
  const response = await fetch("/api/payment/create-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = (await response.json()) as CreateOrderSuccessResponse | CreateOrderErrorResponse;

  if (!response.ok || !isCreateOrderSuccess(data)) {
    const message = isCreateOrderSuccess(data) ? "Failed to create order" : data.error;
    throw new Error(message || "Failed to create order");
  }

  return data.order;
}

/**
 * Opens the Razorpay Checkout modal for a previously created order.
 */
function openRazorpayCheckoutModal(options: {
  key: string;
  order: CreateOrderSuccessResponse["order"];
  merchantName: string;
  description?: string;
  customer: RazorpayCustomerDetails;
  themeColor: string;
  onSuccess: (response: RazorpayPaymentSuccessResponse) => void;
  onFailed: (message: string) => void;
  onDismiss: () => void;
}): void {
  const RazorpayConstructor = window.Razorpay;
  if (!RazorpayConstructor) {
    options.onFailed("Payment gateway could not be loaded");
    return;
  }

  const instance = new RazorpayConstructor({
    key: options.key,
    amount: options.order.amount,
    currency: options.order.currency,
    name: options.merchantName,
    description: options.description ?? "Order payment",
    order_id: options.order.id,
    prefill: {
      name: options.customer.name,
      email: options.customer.email,
      contact: options.customer.contact,
    },
    theme: { color: options.themeColor },
    handler: (response) => {
      console.log("[Razorpay] Payment successful", {
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_signature: response.razorpay_signature,
      });
      options.onSuccess(response);
    },
    modal: {
      ondismiss: () => {
        options.onDismiss();
      },
    },
  });

  instance.on("payment.failed", (response) => {
    const message = response.error?.description || response.error?.reason || "Payment failed";
    options.onFailed(message);
  });

  instance.open();
}

export default function RazorpayCheckout({
  amount,
  currency = "INR",
  receipt,
  notes,
  internalOrderId,
  merchantName,
  description,
  customer,
  themeColor = DEFAULT_THEME_COLOR,
  buttonLabel = "Pay Now",
  className = "",
  disabled = false,
  onPaymentSuccess,
  onPaymentFailed,
  onDismiss,
}: RazorpayCheckoutProps) {
  const [phase, setPhase] = useState<CheckoutPhase>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isProcessing = phase === "loading" || phase === "verifying";
  const isButtonDisabled = disabled || isProcessing || amount <= 0;

  const handlePayNow = useCallback(async () => {
    setPhase("loading");
    setErrorMessage(null);

    try {
      const [key, order] = await Promise.all([
        fetchPublicRazorpayKey(),
        createRazorpayOrder({
          amount,
          currency,
          receipt,
          ...(internalOrderId ? { orderId: internalOrderId } : {}),
          ...(notes || internalOrderId
            ? {
                notes: {
                  ...(notes ?? {}),
                  ...(internalOrderId ? { orderId: internalOrderId } : {}),
                },
              }
            : {}),
        }),
      ]);

      const scriptLoaded = await loadRazorpayCheckoutScript();
      if (!scriptLoaded) {
        throw new Error("Could not load payment gateway. Check your internet connection.");
      }

      openRazorpayCheckoutModal({
        key,
        order,
        merchantName,
        description,
        customer,
        themeColor,
        onSuccess: (response) => {
          setPhase("verifying");
          void verifyPaymentOnServer({
            ...response,
            orderId: internalOrderId,
            amount,
            currency,
          })
            .then((verifyResult) => {
              setPhase("idle");
              onPaymentSuccess?.(response, verifyResult);
            })
            .catch((error) => {
              const message =
                error instanceof Error ? error.message : "Payment verification failed";
              setPhase("idle");
              setErrorMessage(message);
              onPaymentFailed?.(message);
            });
        },
        onFailed: (message) => {
          setPhase("idle");
          setErrorMessage(message);
          onPaymentFailed?.(message);
        },
        onDismiss: () => {
          setPhase("idle");
          const message = "Payment cancelled";
          setErrorMessage(message);
          onDismiss?.();
        },
      });

      // Order created and modal opened — re-enable button while user pays.
      setPhase("idle");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      setPhase("idle");
      setErrorMessage(message);
      onPaymentFailed?.(message);
    }
  }, [
    amount,
    currency,
    receipt,
    notes,
    internalOrderId,
    merchantName,
    description,
    customer,
    themeColor,
    onPaymentSuccess,
    onPaymentFailed,
    onDismiss,
  ]);

  return (
    <div className="flex w-full flex-col gap-2">
      <button
        type="button"
        onClick={() => void handlePayNow()}
        disabled={isButtonDisabled}
        aria-busy={isProcessing}
        className={[
          "inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl px-6",
          "text-sm font-semibold uppercase tracking-wide text-white transition",
          "bg-[#082F63] hover:bg-[#0B3D7A] disabled:cursor-not-allowed disabled:opacity-60",
          className,
        ].join(" ")}
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            {phase === "verifying" ? "Verifying payment…" : "Processing…"}
          </>
        ) : (
          buttonLabel
        )}
      </button>

      {errorMessage ? (
        <p className="text-center text-sm text-red-600" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
