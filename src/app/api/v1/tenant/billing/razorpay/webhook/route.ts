import { NextResponse } from "next/server";
import { handleRazorpayTenantWebhook } from "@/lib/billing/razorpay-tenant";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json();
  const secret = request.headers.get("x-razorpay-signature");
  const webhookSecret = process.env.RAZORPAY_TENANT_WEBHOOK_SECRET;

  if (webhookSecret && secret) {
    const crypto = await import("crypto");
    const expected = crypto
      .createHmac("sha256", webhookSecret)
      .update(JSON.stringify(body))
      .digest("hex");
    if (expected !== secret) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  await handleRazorpayTenantWebhook(body);
  return NextResponse.json({ received: true });
}
