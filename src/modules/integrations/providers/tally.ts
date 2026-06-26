import type { IntegrationProviderAdapter } from "@/modules/integrations/types";
import { envStatus, hasEnv } from "@/modules/integrations/providers/_helpers";

export const tallyAdapter: IntegrationProviderAdapter = {
  id: "TALLY",
  name: "Tally",
  category: "accounting",
  description: "Tally XML/HTTP bridge sync",
  isConfigured: () => hasEnv("TALLY_SERVER_URL"),
  getStatus: () => envStatus(["TALLY_SERVER_URL", "TALLY_COMPANY"], "Tally bridge ready"),
};

export async function exportInvoiceToTally(invoice: Record<string, unknown>) {
  const url = process.env.TALLY_SERVER_URL;
  if (!url) return { exported: false, mock: true };
  const xml = `<ENVELOPE><VOUCHER>${JSON.stringify(invoice)}</VOUCHER></ENVELOPE>`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/xml" },
    body: xml,
  }).catch(() => null);
  return { exported: res?.ok ?? false };
}
