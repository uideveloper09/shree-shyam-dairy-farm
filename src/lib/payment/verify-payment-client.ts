import type { VerifyPaymentSuccessResponse } from "@/app/api/payment/verify/types";
import type { RazorpayPaymentSuccessResponse } from "@/types/razorpay-checkout";

export interface VerifyPaymentClientInput extends RazorpayPaymentSuccessResponse {
  orderId?: string;
  customerId?: string;
  amount?: number;
  currency?: string;
  paymentMethod?: string;
}

/**
 * Verifies a Razorpay payment server-side after checkout success.
 */
export async function verifyPaymentOnServer(
  input: VerifyPaymentClientInput
): Promise<VerifyPaymentSuccessResponse> {
  const response = await fetch("/api/payment/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      razorpay_payment_id: input.razorpay_payment_id,
      razorpay_order_id: input.razorpay_order_id,
      razorpay_signature: input.razorpay_signature,
      orderId: input.orderId,
      customerId: input.customerId,
      amount: input.amount,
      currency: input.currency,
      paymentMethod: input.paymentMethod,
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || data.error || "Payment verification failed");
  }

  return data as VerifyPaymentSuccessResponse;
}
