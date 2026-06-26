/**
 * Request/response contracts for POST /api/payment/create-order.
 */

/** Raw JSON body accepted by the create-order endpoint. */
export interface CreateOrderRequestBody {
  /**
   * Order amount in major currency units for INR (e.g. rupees).
   * Example: 500 → ₹500.00, converted to 50000 paise before calling Razorpay.
   */
  amount: number;
  /** ISO 4217 currency code (e.g. "INR"). */
  currency: string;
  /** Merchant receipt reference — unique, max 40 characters. */
  receipt: string;
  /** Optional key-value metadata stored on the Razorpay order. */
  notes?: Record<string, string>;
  /** Internal order ID — links the Razorpay order to a pending database order. */
  orderId?: string;
}

/** Validated payload passed to the Razorpay SDK (amount in smallest currency unit). */
export interface ParsedCreateOrderPayload {
  amount: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
  orderId?: string;
}

/** Order fields returned to the client on success (no secret data). */
export interface CreateOrderSummary {
  id: string;
  amount: number;
  currency: string;
  status: string;
  receipt: string;
}

/** Successful create-order response returned to the client. */
export interface CreateOrderSuccessResponse {
  success: true;
  order: CreateOrderSummary;
}

/** Error payload for failed create-order requests. */
export interface CreateOrderErrorResponse {
  success: false;
  error: string;
  /** Razorpay error code when the gateway rejected the request. */
  code?: string;
  /** Field that failed validation (client or Razorpay). */
  field?: string;
}

/** Full Razorpay order entity from the SDK (internal use only). */
export interface RazorpayOrderEntity {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string | null;
  offer_id: string | null;
  status: string;
  attempts: number;
  notes: Record<string, string>;
  created_at: number;
}

/**
 * Shape thrown by the official Razorpay Node SDK on API failures.
 * @see node_modules/razorpay/dist/api.js — `normalizeError`
 */
export interface RazorpayApiError {
  statusCode: number;
  error: {
    code: string;
    description: string;
    field?: string;
    source?: string;
    step?: string;
    reason?: string;
    metadata?: Record<string, unknown>;
  };
}
