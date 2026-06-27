/**
 * Order confirmation message templates (email, WhatsApp, SMS, admin).
 */
import type { OrderConfirmationContext } from "./order-confirmation.types";
import { getSiteUrl } from "@/lib/site-url";
import { CUSTOMER_BRAND_NAME } from "@/constants/brand";

const BRAND_NAME = CUSTOMER_BRAND_NAME;

export function buildOrderConfirmationContext(params: {
  orderId: string;
  orderNumber: string;
  paymentStatus: string;
  total: string;
  currency?: string;
  invoiceUrl: string | null;
  deliveryDate: Date | null;
  deliverySlot: string | null;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  userId?: string;
  itemCount: number;
}): OrderConfirmationContext {
  const invoiceLink = params.invoiceUrl || `${getSiteUrl()}/account/orders/${params.orderNumber}`;

  return {
    orderId: params.orderId,
    orderNumber: params.orderNumber,
    paymentStatus: formatPaymentStatus(params.paymentStatus),
    amountFormatted: formatCurrency(params.total, params.currency ?? "INR"),
    currency: params.currency ?? "INR",
    invoiceLink,
    estimatedDelivery: formatEstimatedDelivery(params.deliveryDate, params.deliverySlot),
    customerName: params.customerName,
    customerEmail: params.customerEmail,
    customerPhone: params.customerPhone,
    userId: params.userId,
    itemCount: params.itemCount,
  };
}

function formatPaymentStatus(status: string): string {
  return status.replace(/_/g, " ");
}

function formatCurrency(amount: string, currency: string): string {
  const value = Number(amount);
  if (!Number.isFinite(value)) return amount;
  if (currency === "INR") {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  }
  return new Intl.NumberFormat("en", { style: "currency", currency }).format(value);
}

function formatEstimatedDelivery(deliveryDate: Date | null, deliverySlot: string | null): string {
  if (deliveryDate) {
    const dateLabel = new Intl.DateTimeFormat("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(deliveryDate);

    if (deliverySlot === "MORNING") return `${dateLabel} (Morning slot)`;
    if (deliverySlot === "EVENING") return `${dateLabel} (Evening slot)`;
    return dateLabel;
  }

  const eta = new Date();
  eta.setDate(eta.getDate() + 2);
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(eta);
}

export function buildCustomerEmailSubject(ctx: OrderConfirmationContext): string {
  return `Order ${ctx.orderNumber} confirmed — ${BRAND_NAME}`;
}

export function buildCustomerEmailBody(ctx: OrderConfirmationContext): string {
  return [
    `Hi ${ctx.customerName},`,
    "",
    `Thank you for your order! Your payment has been received.`,
    "",
    `Order Number: ${ctx.orderNumber}`,
    `Payment Status: ${ctx.paymentStatus}`,
    `Amount Paid: ${ctx.amountFormatted}`,
    `Estimated Delivery: ${ctx.estimatedDelivery}`,
    "",
    `View your invoice: ${ctx.invoiceLink}`,
    "",
    `— ${BRAND_NAME}`,
  ].join("\n");
}

export function buildCustomerEmailHtml(ctx: OrderConfirmationContext): string {
  return `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#082F63">
      <h2 style="margin:0 0 16px">Order Confirmed</h2>
      <p>Hi ${escapeHtml(ctx.customerName)},</p>
      <p>Thank you for choosing <strong>${BRAND_NAME}</strong>. Your payment has been received.</p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0">
        <tr><td style="padding:8px 0;color:#666">Order Number</td><td style="padding:8px 0"><strong>${escapeHtml(ctx.orderNumber)}</strong></td></tr>
        <tr><td style="padding:8px 0;color:#666">Payment Status</td><td style="padding:8px 0">${escapeHtml(ctx.paymentStatus)}</td></tr>
        <tr><td style="padding:8px 0;color:#666">Amount</td><td style="padding:8px 0">${escapeHtml(ctx.amountFormatted)}</td></tr>
        <tr><td style="padding:8px 0;color:#666">Estimated Delivery</td><td style="padding:8px 0">${escapeHtml(ctx.estimatedDelivery)}</td></tr>
      </table>
      <a href="${escapeHtml(ctx.invoiceLink)}" style="display:inline-block;background:#082F63;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">View Invoice</a>
      <p style="margin-top:24px;font-size:12px;color:#666">If you have questions, reply to this email or contact us on WhatsApp.</p>
    </div>
  `.trim();
}

export function buildCustomerWhatsAppBody(ctx: OrderConfirmationContext): string {
  return [
    `Order *${ctx.orderNumber}* confirmed!`,
    "",
    `Payment: ${ctx.paymentStatus}`,
    `Amount: ${ctx.amountFormatted}`,
    `Delivery: ${ctx.estimatedDelivery}`,
    "",
    `Invoice: ${ctx.invoiceLink}`,
    "",
    `— ${BRAND_NAME}`,
  ].join("\n");
}

/** SMS body — short format for MSG91 / future providers. */
export function buildCustomerSmsBody(ctx: OrderConfirmationContext): string {
  return `Order ${ctx.orderNumber} confirmed. Paid ${ctx.amountFormatted}. Delivery: ${ctx.estimatedDelivery}. ${BRAND_NAME}`;
}

export function buildAdminNotificationBody(ctx: OrderConfirmationContext): string {
  return [
    `New paid order received.`,
    "",
    `Order Number: ${ctx.orderNumber}`,
    `Payment Status: ${ctx.paymentStatus}`,
    `Amount: ${ctx.amountFormatted}`,
    `Items: ${ctx.itemCount}`,
    `Customer: ${ctx.customerName}`,
    `Estimated Delivery: ${ctx.estimatedDelivery}`,
    `Invoice: ${ctx.invoiceLink}`,
  ].join("\n");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
