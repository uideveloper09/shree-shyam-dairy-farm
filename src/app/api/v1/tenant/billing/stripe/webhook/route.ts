import { NextResponse } from "next/server";
import { handleStripeWebhook } from "@/lib/billing/stripe";
import { getStripeClient } from "@/lib/billing/stripe";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const stripe = await getStripeClient();
  if (!stripe) return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });

  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });
  }

  try {
    const event = stripe.webhooks.constructEvent(body, sig, secret);
    await handleStripeWebhook(
      event as unknown as { type: string; data: { object: Record<string, unknown> } }
    );
    return NextResponse.json({ received: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
