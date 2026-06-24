import { NextResponse } from "next/server";
import crypto from "crypto";
import { saveOrder } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      items,
      bill,
      note,
      coupon,
      customer,
    } = body;

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return NextResponse.json({ error: "Payment not configured" }, { status: 503 });
    }

    const expected = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    const order = await saveOrder({
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      status: "paid",
      items,
      bill,
      note: note || "",
      coupon: coupon?.code || null,
      customer: customer || {},
    });

    return NextResponse.json({ ok: true, orderId: order.id });
  } catch (err) {
    console.error("Verify payment error:", err);
    return NextResponse.json({ error: "Payment verification failed" }, { status: 500 });
  }
}
