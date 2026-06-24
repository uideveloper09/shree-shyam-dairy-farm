import { NextResponse } from "next/server";
import Razorpay from "razorpay";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.json();
    const { amount, items, note, coupon } = body;

    if (!amount || amount < 1 || !items?.length) {
      return NextResponse.json({ error: "Invalid order" }, { status: 400 });
    }

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret || keyId.includes("your_key")) {
      return NextResponse.json(
        { error: "Payment gateway not configured. Add Razorpay keys to .env.local" },
        { status: 503 }
      );
    }

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `ssd_${Date.now()}`,
      notes: {
        items: JSON.stringify(items.map((i) => ({ id: i.id, name: i.name, qty: i.quantity, price: i.price }))),
        note: note || "",
        coupon: coupon?.code || "",
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
    });
  } catch (err) {
    console.error("Create order error:", err);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
