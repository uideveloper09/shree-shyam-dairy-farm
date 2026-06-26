import type { IntegrationProviderAdapter } from "@/modules/integrations/types";
import { envStatus, hasEnv } from "@/modules/integrations/providers/_helpers";

export const cashfreeAdapter: IntegrationProviderAdapter = {
  id: "CASHFREE",
  name: "Cashfree",
  category: "payments",
  description: "Cashfree Payments & Payouts",
  isConfigured: () => hasEnv("CASHFREE_APP_ID", "CASHFREE_SECRET_KEY"),
  getStatus: () => envStatus(["CASHFREE_APP_ID", "CASHFREE_SECRET_KEY"], "Cashfree ready"),
  verifyWebhook: (headers) => {
    const ts = headers.get("x-webhook-timestamp");
    const sig = headers.get("x-webhook-signature");
    return Boolean(ts && sig && process.env.CASHFREE_SECRET_KEY);
  },
};
