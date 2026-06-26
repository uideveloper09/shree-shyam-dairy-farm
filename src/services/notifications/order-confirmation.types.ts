/**
 * Order notification types.
 */

export interface OrderConfirmationContext {
  orderId: string;
  orderNumber: string;
  paymentStatus: string;
  amountFormatted: string;
  currency: string;
  invoiceLink: string;
  estimatedDelivery: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  userId?: string;
  itemCount: number;
}

export interface ChannelNotificationResult {
  channel: "EMAIL" | "WHATSAPP" | "SMS" | "IN_APP";
  deliveryId?: string;
  queued?: boolean;
  skipped?: boolean;
  error?: string;
}

export interface OrderConfirmationNotificationResult {
  sent: boolean;
  skipped?: boolean;
  reason?: string;
  channels: ChannelNotificationResult[];
}
