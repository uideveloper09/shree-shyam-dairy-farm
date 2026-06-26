import { headers } from "next/headers";
import { resolveTenantFromRequest } from "@/lib/tenant/resolve";
import { getTenantConfig } from "@/services/tenant/tenant.service";
import { DEFAULT_TENANT_SLUG } from "@/constants/tenant";

export async function getServerTenantConfig() {
  const h = await headers();
  const request = new Request("http://localhost", {
    headers: {
      host: h.get("host") || "",
      "x-tenant-slug": h.get("x-tenant-slug") || "",
    },
  });

  const tenant = await resolveTenantFromRequest(request);
  return getTenantConfig(tenant?.slug ?? DEFAULT_TENANT_SLUG);
}

export function themeToCssVars(
  theme: {
    primaryColor?: string;
    accentColor?: string;
    backgroundColor?: string;
    textColor?: string;
  } | null
) {
  if (!theme) return {};
  return {
    "--navy": theme.primaryColor || "#082F63",
    "--gold": theme.accentColor || "#C89B3C",
    "--cream": theme.backgroundColor || "#faf9f6",
    "--text": theme.textColor || "#1a1a1a",
  };
}
