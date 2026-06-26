/**
 * Request/response contracts for POST /api/payment/verify.
 */
import type { PaymentMethod } from "@prisma/client";
import type { InsufficientStockItem, StockUpdateResult } from "@/services/inventory/types";

/** Body sent by the client after a successful Razorpay Checkout payment. */
export interface VerifyPaymentRequestBody {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
  /** Internal order ID — used to link payment to the order when set. */
  orderId?: string;
  /** Customer user ID — defaults to the order owner when omitted. */
  customerId?: string;
  /** Amount in major currency units (e.g. rupees). Defaults to order total. */
  amount?: number;
  /** ISO currency code. Defaults to INR. */
  currency?: string;
  /** Payment method enum value (UPI, CARD, NETBANKING, WALLET, COD). */
  paymentMethod?: PaymentMethod;
  /** Server-verified QR / payment-link flow (signature optional). */
  qr_payment?: boolean;
}

export interface VerifyPaymentInventoryResult {
  updated: boolean;
  items: StockUpdateResult[];
}

export interface VerifyPaymentInvoiceResult {
  invoiceNumber: string;
  invoiceUrl: string;
}

/** Response when the payment signature is valid and persisted. */
export interface VerifyPaymentSuccessResponse {
  success: true;
  verified: true;
  message: string;
  paymentSaved: true;
  orderUpdated: true;
  inventory: VerifyPaymentInventoryResult;
  invoice?: VerifyPaymentInvoiceResult;
  notificationsSent?: boolean;
  /** True when this Razorpay payment ID was already stored (idempotent retry). */
  alreadyProcessed?: boolean;
}

/** Response when verification fails or the request is invalid. */
export interface VerifyPaymentFailureResponse {
  success: false;
  verified: boolean;
  message: string;
  paymentSaved?: false;
  orderUpdated?: false;
  orderCancelled?: boolean;
  inventory?: {
    updated: false;
    insufficientItems?: InsufficientStockItem[];
  };
}

export type VerifyPaymentResponse = VerifyPaymentSuccessResponse | VerifyPaymentFailureResponse;
