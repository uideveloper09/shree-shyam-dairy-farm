import { OrderStatus, PaymentStatus, Prisma } from "@prisma/client";
import { prisma, isDatabaseConfigured } from "@/repositories/prisma";
import { ensureProductByLegacyId } from "@/services/catalog/ensure-product";
import { generateOrderNumber } from "./order-number";

export interface CheckoutCartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  unit?: string;
}

export interface CheckoutBill {
  subtotal: number;
  shippingCharge?: number;
  discount?: number;
  tax?: number;
  estimatedTotal: number;
}

export interface CreateCheckoutOrderInput {
  items: CheckoutCartItem[];
  bill: CheckoutBill;
  note?: string;
  couponCode?: string;
  guestEmail?: string;
  guestPhone?: string;
  userId?: string;
}

export interface CreateCheckoutOrderResult {
  orderId: string;
  orderNumber: string;
  receipt: string;
  amount: number;
}

/**
 * Creates a pending database order from cart checkout data (step before Razorpay).
 */
export async function createCheckoutOrder(
  input: CreateCheckoutOrderInput
): Promise<CreateCheckoutOrderResult> {
  if (!isDatabaseConfigured()) {
    throw new Error("Order checkout requires database configuration");
  }

  if (!input.items.length) {
    throw new Error("Cart is empty");
  }

  const orderNumber = await generateOrderNumber();
  const receipt = orderNumber;

  const productRows = await Promise.all(
    input.items.map(async (item) => {
      const product = await ensureProductByLegacyId(item.id);

      return {
        item,
        product,
      };
    })
  );

  const orderItems = productRows.map(({ item, product }) => ({
    productId: product.id,
    name: product.name,
    price: new Prisma.Decimal(Number(product.price)),
    quantity: item.quantity,
    unit: product.unit ?? item.unit ?? null,
  }));

  const order = await prisma.order.create({
    data: {
      orderNumber,
      userId: input.userId ?? null,
      guestEmail: input.guestEmail ?? null,
      guestPhone: input.guestPhone ?? null,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      subtotal: new Prisma.Decimal(input.bill.subtotal),
      shippingCharge: new Prisma.Decimal(input.bill.shippingCharge ?? 0),
      discount: new Prisma.Decimal(input.bill.discount ?? 0),
      tax: new Prisma.Decimal(input.bill.tax ?? 0),
      total: new Prisma.Decimal(input.bill.estimatedTotal),
      couponCode: input.couponCode ?? null,
      note: input.note ?? null,
      items: {
        create: orderItems,
      },
    },
    select: {
      id: true,
      orderNumber: true,
      total: true,
    },
  });

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    receipt,
    amount: Number(order.total),
  };
}
