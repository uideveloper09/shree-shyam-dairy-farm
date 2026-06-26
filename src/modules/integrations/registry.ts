import type { IntegrationProviderAdapter } from "@/modules/integrations/types";
import { razorpayAdapter } from "@/modules/integrations/providers/razorpay";
import { phonepeAdapter } from "@/modules/integrations/providers/phonepe";
import { cashfreeAdapter } from "@/modules/integrations/providers/cashfree";
import { gstAdapter } from "@/modules/integrations/providers/gst";
import { whatsappAdapter } from "@/modules/integrations/providers/whatsapp";
import { googleMapsAdapter } from "@/modules/integrations/providers/google-maps";
import { firebaseAdapter } from "@/modules/integrations/providers/firebase";
import { googleAnalyticsAdapter } from "@/modules/integrations/providers/google-analytics";
import { metaPixelAdapter } from "@/modules/integrations/providers/meta-pixel";
import { shiprocketAdapter } from "@/modules/integrations/providers/shiprocket";
import { delhiveryAdapter } from "@/modules/integrations/providers/delhivery";
import { indiaPostAdapter } from "@/modules/integrations/providers/india-post";
import { sapAdapter } from "@/modules/integrations/providers/sap";
import { tallyAdapter } from "@/modules/integrations/providers/tally";
import { quickbooksAdapter } from "@/modules/integrations/providers/quickbooks";
import type { IntegrationProvider } from "@prisma/client";

const REGISTRY: IntegrationProviderAdapter[] = [
  razorpayAdapter,
  phonepeAdapter,
  cashfreeAdapter,
  gstAdapter,
  whatsappAdapter,
  googleMapsAdapter,
  firebaseAdapter,
  googleAnalyticsAdapter,
  metaPixelAdapter,
  shiprocketAdapter,
  delhiveryAdapter,
  indiaPostAdapter,
  sapAdapter,
  tallyAdapter,
  quickbooksAdapter,
];

export function getAllProviders(): IntegrationProviderAdapter[] {
  return REGISTRY;
}

export function getProvider(id: IntegrationProvider): IntegrationProviderAdapter | undefined {
  return REGISTRY.find((p) => p.id === id);
}

export function getProvidersByCategory(category: string) {
  return REGISTRY.filter((p) => p.category === category);
}

export function getProviderCatalog() {
  return REGISTRY.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    description: p.description,
    status: p.getStatus(),
  }));
}
