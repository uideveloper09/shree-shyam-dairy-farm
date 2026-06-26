import { createHash } from "crypto";
import type { IntegrationProviderAdapter } from "@/modules/integrations/types";
import { envStatus, hasEnv } from "@/modules/integrations/providers/_helpers";

export const phonepeAdapter: IntegrationProviderAdapter = {
  id: "PHONEPE",
  name: "PhonePe",
  category: "payments",
  description: "PhonePe Payment Gateway",
  isConfigured: () => hasEnv("PHONEPE_MERCHANT_ID", "PHONEPE_SALT_KEY"),
  getStatus: () =>
    envStatus(
      ["PHONEPE_MERCHANT_ID", "PHONEPE_SALT_KEY", "PHONEPE_SALT_INDEX"],
      "PhonePe gateway ready"
    ),
  verifyWebhook: (headers, body) => {
    const auth = headers.get("x-verify");
    if (!auth || !process.env.PHONEPE_SALT_KEY) return false;
    const expected =
      createHash("sha256")
        .update(body + process.env.PHONEPE_SALT_KEY)
        .digest("hex") +
      "###" +
      (process.env.PHONEPE_SALT_INDEX || "1");
    return auth === expected;
  },
};
