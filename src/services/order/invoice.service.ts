import { prisma } from "@/repositories/prisma";

export interface OrderInvoiceResult {
  invoiceNumber: string;
  invoiceUrl: string;
}

/**
 * Assigns an invoice number and public URL to a paid order (idempotent).
 */
export async function generateOrderInvoice(orderId: string): Promise<OrderInvoiceResult> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderNumber: true,
      invoiceNumber: true,
      invoiceUrl: true,
    },
  });

  if (!order) {
    throw new Error("Order not found for invoice generation");
  }

  if (order.invoiceNumber && order.invoiceUrl) {
    return {
      invoiceNumber: order.invoiceNumber,
      invoiceUrl: order.invoiceUrl,
    };
  }

  const year = new Date().getFullYear();
  const seq = order.orderNumber.replace(/\D/g, "").slice(-6).padStart(6, "0");
  const invoiceNumber = order.invoiceNumber ?? `INV/${year}/${seq}`;

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
  const invoiceUrl = order.invoiceUrl ?? `${baseUrl}/account/orders/${order.orderNumber}`;

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { invoiceNumber, invoiceUrl },
    select: { invoiceNumber: true, invoiceUrl: true },
  });

  return {
    invoiceNumber: updated.invoiceNumber!,
    invoiceUrl: updated.invoiceUrl!,
  };
}
