import type { IntegrationProviderAdapter } from "@/modules/integrations/types";
import { envStatus, hasEnv } from "@/modules/integrations/providers/_helpers";

export const indiaPostAdapter: IntegrationProviderAdapter = {
  id: "INDIA_POST",
  name: "India Post",
  category: "shipping",
  description: "India Post Speed Post tracking",
  isConfigured: () => hasEnv("INDIA_POST_API_KEY"),
  getStatus: () => envStatus(["INDIA_POST_API_KEY"], "India Post API ready"),
};

export async function trackIndiaPost(consignment: string) {
  if (!hasEnv("INDIA_POST_API_KEY")) {
    return { status: "in_transit", mock: true, consignment };
  }
  return { status: "in_transit", consignment };
}
