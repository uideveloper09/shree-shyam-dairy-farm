import { NextResponse } from "next/server";
import { getRazorpayClient } from "@/utils/razorpayServer";

export const dynamic = "force-dynamic";

const QR_EXPIRY_SECONDS = 1800;

function isTestMode() {
  return process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.includes("_test_");
}

function buildPaymentLinkQrImage(shortUrl) {
  const params = new URLSearchParams({
    size: "200x200",
    data: shortUrl,
    margin: "8",
  });
  return `https://api.qrserver.com/v1/create-qr-code/?${params.toString()}`;
}

function orderPayload(order) {
  return {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  };
}

async function createUpiQrCode(razorpay, order, method) {
  const qr = await razorpay.qrCode.create({
    type: "upi_qr",
    name: "Shree Shyam Dairy Farm",
    usage: "single_use",
    fixed_amount: true,
    payment_amount: order.amount,
    description: "Farm-fresh dairy order",
    notes: {
      order_id: order.id,
      pay_method: method,
    },
    close_by: Math.floor(Date.now() / 1000) + QR_EXPIRY_SECONDS,
  });

  return {
    qrId: qr.id,
    qrImageUrl: qr.image_url,
    qrKind: "qr_code",
  };
}

async function createUpiPaymentLinkQr(razorpay, order, method) {
  const link = await razorpay.paymentLink.create({
    amount: order.amount,
    currency: order.currency,
    description: "Farm-fresh dairy order",
    upi_link: true,
    reference_id: order.id,
    expire_by: Math.floor(Date.now() / 1000) + QR_EXPIRY_SECONDS,
    customer: {
      name: "Customer",
      contact: process.env.RAZORPAY_CUSTOMER_CONTACT || "9999999999",
      email: process.env.RAZORPAY_CUSTOMER_EMAIL || "shreeshyamdairyfarm@gmail.com",
    },
    notify: { sms: false, email: false },
    notes: {
      order_id: order.id,
      pay_method: method,
    },
  });

  return {
    qrId: link.id,
    qrImageUrl: buildPaymentLinkQrImage(link.short_url),
    qrKind: "payment_link",
    payUrl: link.short_url,
  };
}

function qrUnavailableMessage() {
  if (isTestMode()) {
    return "Test mode: inline QR nahi milta. Neeche Pay dabayein — Razorpay checkout mein UPI QR milega.";
  }

  return "Account par scan QR enable nahi hai. Neeche Pay dabayein — Razorpay UPI checkout se pay karein.";
}

export async function POST(request) {
  let order;

  try {
    const body = await request.json();
    const { amount, receipt, internalOrderId, method = "upi" } = body;

    if (!amount || amount < 1) {
      return NextResponse.json({ error: "Invalid order" }, { status: 400 });
    }

    const razorpay = getRazorpayClient();
    if (!razorpay) {
      return NextResponse.json({ error: "Payment gateway not configured" }, { status: 503 });
    }

    order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: receipt || `ssd_${Date.now()}`,
      notes: {
        ...(internalOrderId ? { orderId: internalOrderId } : {}),
        pay_method: method,
      },
    });

    if (internalOrderId) {
      const { isDatabaseConfigured, prisma } = await import("@/repositories/prisma");
      if (isDatabaseConfigured()) {
        await prisma.order.update({
          where: { id: internalOrderId },
          data: { razorpayOrderId: order.id },
        });
      }
    }

    let qrPayload;

    try {
      qrPayload = await createUpiQrCode(razorpay, order, method);
    } catch (qrErr) {
      const qrMessage =
        qrErr?.error?.description || qrErr?.error?.reason || qrErr?.message || "QR API unavailable";
      console.warn("Razorpay QR API failed, trying payment link fallback:", qrMessage);

      try {
        qrPayload = await createUpiPaymentLinkQr(razorpay, order, method);
      } catch (linkErr) {
        const linkMessage =
          linkErr?.error?.description ||
          linkErr?.error?.reason ||
          linkErr?.message ||
          "Unknown error";
        console.warn("UPI payment link fallback failed:", linkMessage);

        return NextResponse.json({
          ...orderPayload(order),
          qrFailed: true,
          qrError: qrUnavailableMessage(),
        });
      }
    }

    return NextResponse.json({
      ...orderPayload(order),
      ...qrPayload,
    });
  } catch (err) {
    const message =
      err?.error?.description || err?.error?.reason || err?.message || "Unknown error";
    console.error("UPI QR error:", message, err?.error || err);

    if (order) {
      return NextResponse.json({
        ...orderPayload(order),
        qrFailed: true,
        qrError: qrUnavailableMessage(),
      });
    }

    return NextResponse.json(
      { error: "Failed to create payment QR", detail: message },
      { status: 500 }
    );
  }
}
