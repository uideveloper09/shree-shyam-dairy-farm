import type { IntegrationProviderAdapter } from "@/modules/integrations/types";
import { envStatus, hasEnv } from "@/modules/integrations/providers/_helpers";

export const googleAnalyticsAdapter: IntegrationProviderAdapter = {
  id: "GOOGLE_ANALYTICS",
  name: "Google Analytics",
  category: "analytics",
  description: "GA4 measurement protocol",
  isConfigured: () => hasEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID"),
  getStatus: () =>
    envStatus(["NEXT_PUBLIC_GA_MEASUREMENT_ID", "GA_API_SECRET"], "GA4 tracking active"),
};

export function getGaScriptSnippet() {
  const id = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  if (!id) return null;
  return `https://www.googletagmanager.com/gtag/js?id=${id}`;
}
