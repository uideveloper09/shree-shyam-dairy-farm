import type { IntegrationProviderAdapter } from "@/modules/integrations/types";
import { envStatus, hasEnv } from "@/modules/integrations/providers/_helpers";

export const sapAdapter: IntegrationProviderAdapter = {
  id: "SAP",
  name: "SAP",
  category: "accounting",
  description: "SAP ERP sync (orders, inventory, GL)",
  isConfigured: () => hasEnv("SAP_API_URL", "SAP_CLIENT_ID"),
  getStatus: () =>
    envStatus(["SAP_API_URL", "SAP_CLIENT_ID", "SAP_CLIENT_SECRET"], "SAP connected"),
};

export async function syncOrderToSap(order: Record<string, unknown>) {
  if (!hasEnv("SAP_API_URL")) return { synced: false, mock: true };
  const res = await fetch(`${process.env.SAP_API_URL}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(order),
  }).catch(() => null);
  return { synced: res?.ok ?? false };
}
