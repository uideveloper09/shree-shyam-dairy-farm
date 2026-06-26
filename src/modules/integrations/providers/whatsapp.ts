import type { IntegrationProviderAdapter } from "@/modules/integrations/types";
import { envStatus, hasEnv } from "@/modules/integrations/providers/_helpers";

export const whatsappAdapter: IntegrationProviderAdapter = {
  id: "WHATSAPP",
  name: "WhatsApp Business",
  category: "messaging",
  description: "WhatsApp Cloud API messaging",
  isConfigured: () => hasEnv("WHATSAPP_API_TOKEN", "WHATSAPP_PHONE_NUMBER_ID"),
  getStatus: () =>
    envStatus(["WHATSAPP_API_TOKEN", "WHATSAPP_PHONE_NUMBER_ID"], "WhatsApp connected"),
  verifyWebhook: (headers) => {
    const token = process.env.WHATSAPP_VERIFY_TOKEN;
    return headers.get("x-hub-signature-256") !== null || Boolean(token);
  },
};
