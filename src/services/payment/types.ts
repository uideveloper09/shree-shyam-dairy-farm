/**
 * Payment persistence types (Step 5 — Razorpay integration).
 */
import type { PaymentMethod } from "@prisma/client";
import type { StockUpdateResult } from "@/services/inventory/types";

/** Input for persisting a verified Razorpay payment and updating the order. */
export interface PersistVerifiedPaymentInput {
  /** Internal order ID when known (preferred lookup). */
  orderId?: string;
  /** Customer user ID when known; otherwise taken from the order record. */
  customerId?: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  /** Amount in major currency units (e.g. rupees). Defaults to order total. */
  amount?: number;
  /** ISO currency code. Defaults to INR. */
  currency?: string;
  /** Payment method. Defaults to order method or UPI. */
  paymentMethod?: PaymentMethod;
}

/** Invoice details generated after successful payment. */
export interface OrderInvoiceDetails {
  invoiceNumber: string;
  invoiceUrl: string;
}

/** Result returned after a successful persistence operation. */
export interface PersistVerifiedPaymentResult {
  paymentSaved: true;
  orderUpdated: true;
  inventoryUpdated: boolean;
  stockUpdates: StockUpdateResult[];
  invoiceGenerated: boolean;
  invoice?: OrderInvoiceDetails;
  notificationsSent: boolean;
  alreadyProcessed: boolean;
  orderId: string;
  paymentId: string;
}

/** Thrown when no matching order exists for persistence. */
export class OrderNotFoundForPaymentError extends Error {
  constructor(message = "Order not found for the given payment reference") {
    super(message);
    this.name = "OrderNotFoundForPaymentError";
  }
}

/** Thrown when the database is unavailable for persistence. */
export class PaymentPersistenceError extends Error {
  constructor(message = "Failed to persist payment") {
    super(message);
    this.name = "PaymentPersistenceError";
  }
}
