import { createHmac } from "crypto";
import { isRazorpayConfigured } from "@/utils/razorpayServer";
import type { IntegrationProviderAdapter } from "@/modules/integrations/types";
import { envStatus } from "@/modules/integrations/providers/_helpers";

export const razorpayAdapter: IntegrationProviderAdapter = {
  id: "RAZORPAY",
  name: "Razorpay",
  category: "payments",
  description: "UPI, cards, netbanking, subscriptions",
  isConfigured: () => isRazorpayConfigured(),
  getStatus: () =>
    envStatus(["NEXT_PUBLIC_RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"], "Payments active"),
  verifyWebhook: (headers, body) => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const sig = headers.get("x-razorpay-signature");
    if (!secret || !sig) return !secret;
    const expected = createHmac("sha256", secret).update(body).digest("hex");
    return expected === sig;
  },
  handleWebhook: async (_headers, body) => {
    const data = JSON.parse(body) as { event?: string; payload?: unknown };
    return { ok: true, event: data.event, data: data.payload };
  },
};
