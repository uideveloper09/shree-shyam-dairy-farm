/**
 * Razorpay storefront webhook payload types.
 * @see https://razorpay.com/docs/webhooks/payloads/
 */

export const RAZORPAY_WEBHOOK_EVENTS = [
  "payment.authorized",
  "payment.captured",
  "payment.failed",
  "order.paid",
  "refund.created",
  "refund.processed",
] as const;

export type RazorpayWebhookEventType = (typeof RAZORPAY_WEBHOOK_EVENTS)[number];

export interface RazorpayWebhookEntityWrapper<T> {
  entity: T;
}

export interface RazorpayPaymentEntity {
  id: string;
  entity?: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
  method?: string;
  captured?: boolean;
  captured_at?: number;
  created_at?: number;
  error_code?: string | null;
  error_description?: string | null;
}

export interface RazorpayOrderEntity {
  id: string;
  entity?: string;
  amount: number;
  currency: string;
  status: string;
  receipt?: string | null;
}

export interface RazorpayRefundEntity {
  id: string;
  entity?: string;
  payment_id: string;
  amount: number;
  currency: string;
  status: string;
  created_at?: number;
}

export interface RazorpayWebhookPayload {
  payment?: RazorpayWebhookEntityWrapper<RazorpayPaymentEntity>;
  order?: RazorpayWebhookEntityWrapper<RazorpayOrderEntity>;
  refund?: RazorpayWebhookEntityWrapper<RazorpayRefundEntity>;
}

export interface RazorpayWebhookEventBody {
  id?: string;
  entity?: string;
  account_id?: string;
  event: string;
  contains?: string[];
  payload: RazorpayWebhookPayload;
  created_at?: number;
}

export interface ParsedRazorpayWebhookEvent {
  eventId: string;
  eventType: string;
  payload: RazorpayWebhookPayload;
  raw: RazorpayWebhookEventBody;
}

export interface ProcessWebhookResult {
  duplicate: boolean;
  processed: boolean;
  eventType: string;
  eventId: string;
}
