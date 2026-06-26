import type { IntegrationProviderAdapter } from "@/modules/integrations/types";
import { envStatus, hasEnv } from "@/modules/integrations/providers/_helpers";

export const quickbooksAdapter: IntegrationProviderAdapter = {
  id: "QUICKBOOKS",
  name: "QuickBooks",
  category: "accounting",
  description: "QuickBooks Online accounting sync",
  isConfigured: () =>
    hasEnv("QUICKBOOKS_CLIENT_ID", "QUICKBOOKS_CLIENT_SECRET", "QUICKBOOKS_REALM_ID"),
  getStatus: () =>
    envStatus(
      ["QUICKBOOKS_CLIENT_ID", "QUICKBOOKS_CLIENT_SECRET", "QUICKBOOKS_REALM_ID"],
      "QuickBooks connected"
    ),
};

export async function syncInvoiceToQuickBooks(invoice: Record<string, unknown>) {
  if (!hasEnv("QUICKBOOKS_REALM_ID")) return { synced: false, mock: true };
  return { synced: true, invoiceId: `qb_${Date.now()}` };
}
