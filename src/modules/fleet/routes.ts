import type { RouteStop } from "@/modules/fleet/types";

/** Haversine distance in km between two lat/lng points */
function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/** Nearest-neighbor route optimization from depot (first stop or origin) */
export function optimizeRoute(
  stops: RouteStop[],
  origin?: { lat: number; lng: number }
): { order: string[]; totalDistanceKm: number; estimatedMinutes: number } {
  if (stops.length === 0) {
    return { order: [], totalDistanceKm: 0, estimatedMinutes: 0 };
  }

  const start = origin ?? { lat: stops[0].lat, lng: stops[0].lng };
  const remaining = [...stops];
  const order: string[] = [];
  let current = start;
  let total = 0;

  while (remaining.length > 0) {
    let nearestIdx = 0;
    let nearestDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const d = distanceKm(current, remaining[i]);
      if (d < nearestDist) {
        nearestDist = d;
        nearestIdx = i;
      }
    }
    const next = remaining.splice(nearestIdx, 1)[0];
    order.push(next.id);
    total += nearestDist;
    current = { lat: next.lat, lng: next.lng };
  }

  const avgSpeedKmh = 35;
  const estimatedMinutes = Math.round((total / avgSpeedKmh) * 60);

  return {
    order,
    totalDistanceKm: Math.round(total * 100) / 100,
    estimatedMinutes,
  };
}
