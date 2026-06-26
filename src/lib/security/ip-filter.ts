import { getClientIp } from "@/lib/security/request-context";

function parseList(envKey: string): string[] {
  return (process.env[envKey] || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function isIpAllowed(request: Request): { allowed: boolean; ip: string; reason?: string } {
  const ip = getClientIp(request);
  const whitelist = parseList("IP_WHITELIST");
  const blacklist = parseList("IP_BLACKLIST");

  if (blacklist.includes(ip)) {
    return { allowed: false, ip, reason: "blacklisted" };
  }

  if (whitelist.length > 0 && !whitelist.includes(ip)) {
    return { allowed: false, ip, reason: "not_whitelisted" };
  }

  return { allowed: true, ip };
}

export function isAdminIpAllowed(request: Request): boolean {
  const adminWhitelist = parseList("ADMIN_IP_WHITELIST");
  if (adminWhitelist.length === 0) return true;
  const ip = getClientIp(request);
  return adminWhitelist.includes(ip);
}
