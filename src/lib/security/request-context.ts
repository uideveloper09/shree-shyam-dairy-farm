export type RequestContext = {
  ip: string;
  userAgent: string;
  deviceLabel: string;
};

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}

export function parseDeviceLabel(userAgent: string): string {
  if (!userAgent || userAgent === "unknown") return "Unknown device";
  if (/iPhone|iPad/i.test(userAgent)) return "Apple Mobile";
  if (/Android/i.test(userAgent)) return "Android";
  if (/Windows/i.test(userAgent)) return "Windows";
  if (/Macintosh/i.test(userAgent)) return "Mac";
  if (/Linux/i.test(userAgent)) return "Linux";
  return "Web Browser";
}

export function getRequestContext(request: Request): RequestContext {
  const userAgent = request.headers.get("user-agent") || "unknown";
  return {
    ip: getClientIp(request),
    userAgent,
    deviceLabel: parseDeviceLabel(userAgent),
  };
}
