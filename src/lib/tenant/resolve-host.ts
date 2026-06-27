import { DEFAULT_TENANT_SLUG } from "@/constants/tenant";

/**
 * Edge-safe tenant slug resolution from the request host (no database imports).
 */
export function resolveTenantFromHost(host: string): string | null {
  const base = (process.env.NEXT_PUBLIC_APP_DOMAIN || "kunwardairy.com").toLowerCase();
  const h = host.toLowerCase().split(":")[0]!;

  if (h === base || h === "localhost") return DEFAULT_TENANT_SLUG;

  if (h.endsWith(`.${base}`)) {
    const sub = h.replace(`.${base}`, "");
    if (sub && sub !== "www") return sub;
  }

  return null;
}
