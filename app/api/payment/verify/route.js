import { NextResponse } from "next/server";
import crypto from "crypto";
import { saveOrder } from "@/lib/data";
import { getRazorpayClient } from "@/lib/razorpayServer";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      qr_payment: qrPayment,
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

    if (qrPayment) {
      const razorpay = getRazorpayClient();
      if (!razorpay) {
        return NextResponse.json({ error: "Payment not configured" }, { status: 503 });
      }

      const payment = await razorpay.payments.fetch(razorpay_payment_id);
      if (payment.status !== "captured") {
        return NextResponse.json({ error: "Payment not completed" }, { status: 400 });
      }

      if (payment.order_id && payment.order_id !== razorpay_order_id) {
        return NextResponse.json({ error: "Order mismatch" }, { status: 400 });
      }
    } else {
      const expected = crypto
        .createHmac("sha256", secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      if (expected !== razorpay_signature) {
        return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
      }
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
