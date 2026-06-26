import type { IntegrationProviderAdapter } from "@/modules/integrations/types";
import { envStatus, hasEnv } from "@/modules/integrations/providers/_helpers";

export const googleMapsAdapter: IntegrationProviderAdapter = {
  id: "GOOGLE_MAPS",
  name: "Google Maps",
  category: "maps",
  description: "Geocoding, directions, delivery zones",
  isConfigured: () => hasEnv("GOOGLE_MAPS_API_KEY"),
  getStatus: () => envStatus(["GOOGLE_MAPS_API_KEY"], "Maps API ready"),
};

export async function geocodeAddress(address: string) {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return { lat: null, lng: null, mock: true };
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${key}`;
  const res = await fetch(url);
  const data = (await res.json()) as {
    results?: { geometry: { location: { lat: number; lng: number } } }[];
  };
  const loc = data.results?.[0]?.geometry?.location;
  return loc ?? { lat: null, lng: null };
}
