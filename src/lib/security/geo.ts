import { getClientIp } from "@/lib/security/request-context";

/** Simple geo blocking via env — GEO_BLOCK_COUNTRIES=CN,RU or GEO_ALLOW_COUNTRIES=IN */
export function isGeoBlocked(request: Request): { blocked: boolean; country?: string } {
  if (process.env.GEO_BLOCKING_ENABLED !== "true") {
    return { blocked: false };
  }

  const country =
    request.headers.get("cf-ipcountry") || request.headers.get("x-country-code") || "unknown";
  const blockList = (process.env.GEO_BLOCK_COUNTRIES || "")
    .split(",")
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean);
  const allowList = (process.env.GEO_ALLOW_COUNTRIES || "")
    .split(",")
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean);

  if (allowList.length > 0 && !allowList.includes(country.toUpperCase())) {
    return { blocked: true, country };
  }

  if (blockList.includes(country.toUpperCase())) {
    return { blocked: true, country };
  }

  if (country === "unknown" && process.env.GEO_BLOCK_UNKNOWN === "true") {
    return { blocked: true, country };
  }

  void getClientIp(request);
  return { blocked: false, country };
}
