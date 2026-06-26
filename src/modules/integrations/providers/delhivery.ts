import type { IntegrationProviderAdapter } from "@/modules/integrations/types";
import { envStatus, hasEnv } from "@/modules/integrations/providers/_helpers";

export const delhiveryAdapter: IntegrationProviderAdapter = {
  id: "DELHIVERY",
  name: "Delhivery",
  category: "shipping",
  description: "Delhivery logistics API",
  isConfigured: () => hasEnv("DELHIVERY_API_TOKEN"),
  getStatus: () => envStatus(["DELHIVERY_API_TOKEN"], "Delhivery connected"),
};

export async function trackDelhivery(waybill: string) {
  const token = process.env.DELHIVERY_API_TOKEN;
  if (!token) return { status: "unknown", mock: true, waybill };
  const res = await fetch(`https://track.delhivery.com/api/v1/packages/json/?waybill=${waybill}`, {
    headers: { Authorization: `Token ${token}` },
  }).catch(() => null);
  if (!res?.ok) return { status: "error", waybill };
  return res.json();
}
