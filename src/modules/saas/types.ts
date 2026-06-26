import type { SaasListingType, SaasPartnerType } from "@prisma/client";

export const LISTING_TYPE_LABELS: Record<SaasListingType, string> = {
  APP: "App",
  PLUGIN: "Plugin",
  INTEGRATION: "Integration",
  API: "API",
};

export const PARTNER_TYPE_LABELS: Record<SaasPartnerType, string> = {
  PARTNER: "Partner",
  RESELLER: "Reseller",
};
