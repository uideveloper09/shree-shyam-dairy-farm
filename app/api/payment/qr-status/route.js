import { NextResponse } from "next/server";
import { getRazorpayClient } from "@/lib/razorpayServer";

export const dynamic = "force-dynamic";

function getPaymentLinkPayment(link) {
  if (!link?.payments) return null;

  if (Array.isArray(link.payments)) {
    return link.payments.find((p) => p.status === "captured") || link.payments[0];
  }

  return link.payments.status === "captured" ? link.payments : null;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const qrId = searchParams.get("qrId");
    const orderId = searchParams.get("orderId");
    const qrKind = searchParams.get("qrKind") || (qrId?.startsWith("plink_") ? "payment_link" : "qr_code");

    if (!qrId || !orderId) {
      return NextResponse.json({ error: "Missing qrId or orderId" }, { status: 400 });
    }

    const razorpay = getRazorpayClient();
    if (!razorpay) {
      return NextResponse.json({ error: "Payment gateway not configured" }, { status: 503 });
    }

    if (qrKind === "payment_link") {
      const link = await razorpay.paymentLink.fetch(qrId);

      if (link.status !== "paid") {
        return NextResponse.json({ paid: false });
      }

      const payment = getPaymentLinkPayment(link);
      if (!payment?.payment_id) {
        return NextResponse.json({ paid: false });
      }

      return NextResponse.json({
        paid: true,
        paymentId: payment.payment_id,
        orderId,
      });
    }

    const payments = await razorpay.qrCode.fetchAllPayments(qrId);
    const captured = payments.items?.find((p) => p.status === "captured");

    if (!captured) {
      return NextResponse.json({ paid: false });
    }

    if (captured.order_id && captured.order_id !== orderId) {
      return NextResponse.json({ error: "Order mismatch" }, { status: 400 });
    }

    return NextResponse.json({
      paid: true,
      paymentId: captured.id,
      orderId: captured.order_id || orderId,
    });
  } catch (err) {
    console.error("QR status error:", err);
    return NextResponse.json({ error: "Failed to check payment status" }, { status: 500 });
  }
}
