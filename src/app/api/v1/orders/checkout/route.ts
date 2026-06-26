import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { createCheckoutOrder } from "@/services/order/checkout.service";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/orders/checkout
 * Creates a pending order from cart data before Razorpay payment.
 */
export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const raw = body as Record<string, unknown>;
  const items = raw.items;
  const bill = raw.bill;

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Cart items are required" }, { status: 400 });
  }

  if (typeof bill !== "object" || bill === null) {
    return NextResponse.json({ error: "Bill summary is required" }, { status: 400 });
  }

  const billData = bill as Record<string, unknown>;
  const estimatedTotal = billData.estimatedTotal;

  if (typeof estimatedTotal !== "number" || estimatedTotal <= 0) {
    return NextResponse.json({ error: "Invalid order total" }, { status: 400 });
  }

  const user = await getCurrentUser();

  try {
    const order = await createCheckoutOrder({
      items: items as Parameters<typeof createCheckoutOrder>[0]["items"],
      bill: {
        subtotal: Number(billData.subtotal ?? estimatedTotal),
        shippingCharge: Number(billData.shippingCharge ?? 0),
        discount: Number(billData.discount ?? 0),
        tax: Number(billData.tax ?? 0),
        estimatedTotal,
      },
      note: typeof raw.note === "string" ? raw.note : undefined,
      couponCode: typeof raw.couponCode === "string" ? raw.couponCode : undefined,
      guestEmail: typeof raw.guestEmail === "string" ? raw.guestEmail : undefined,
      guestPhone: typeof raw.guestPhone === "string" ? raw.guestPhone : undefined,
      userId: user?.id,
    });

    return NextResponse.json({ success: true, ...order }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create order";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
