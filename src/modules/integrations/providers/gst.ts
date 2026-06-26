import type { IntegrationProviderAdapter } from "@/modules/integrations/types";
import { envStatus, hasEnv } from "@/modules/integrations/providers/_helpers";

export const gstAdapter: IntegrationProviderAdapter = {
  id: "GST",
  name: "GST APIs",
  category: "tax",
  description: "GSTIN verification, e-invoice, e-way bill",
  isConfigured: () => hasEnv("GST_API_KEY"),
  getStatus: () => envStatus(["GST_API_KEY", "GST_GSTIN"], "GST API connected"),
};

export async function verifyGstin(gstin: string) {
  if (!hasEnv("GST_API_KEY")) {
    return { valid: false, mock: true, gstin, message: "Configure GST_API_KEY" };
  }
  const res = await fetch(
    `https://appyflow.in/api/verifyGST?key=${process.env.GST_API_KEY}&gstNo=${gstin}`
  ).catch(() => null);
  if (!res?.ok) return { valid: false, gstin };
  return res.json();
}
