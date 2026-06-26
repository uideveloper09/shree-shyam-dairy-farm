import type { IntegrationProviderAdapter } from "@/modules/integrations/types";
import { envStatus, hasEnv } from "@/modules/integrations/providers/_helpers";

export const metaPixelAdapter: IntegrationProviderAdapter = {
  id: "META_PIXEL",
  name: "Meta Pixel",
  category: "analytics",
  description: "Facebook / Instagram conversion tracking",
  isConfigured: () => hasEnv("NEXT_PUBLIC_META_PIXEL_ID"),
  getStatus: () => envStatus(["NEXT_PUBLIC_META_PIXEL_ID"], "Meta Pixel active"),
};

export function getMetaPixelSnippet() {
  const id = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  if (!id) return null;
  return { pixelId: id };
}
