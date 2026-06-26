import type { Permission } from "@/lib/security/permissions";
import { hasPermission } from "@/lib/security/permissions";

export type MobileAppId = "customer" | "delivery" | "farm" | "vet" | "owner";

export type MobileAppConfig = {
  id: MobileAppId;
  name: string;
  path: string;
  permission: Permission;
  icon: string;
  description: string;
};

export const MOBILE_APPS: MobileAppConfig[] = [
  {
    id: "customer",
    name: "Customer App",
    path: "/m/customer",
    permission: "mobile:customer",
    icon: "shopping-bag",
    description: "Orders, subscriptions, tracking",
  },
  {
    id: "delivery",
    name: "Delivery Boy",
    path: "/m/delivery",
    permission: "mobile:delivery",
    icon: "truck",
    description: "Routes, GPS, proof of delivery",
  },
  {
    id: "farm",
    name: "Farm Manager",
    path: "/m/farm",
    permission: "mobile:farm",
    icon: "tractor",
    description: "IoT, weather, farm operations",
  },
  {
    id: "vet",
    name: "Veterinarian",
    path: "/m/vet",
    permission: "mobile:vet",
    icon: "stethoscope",
    description: "Cattle health, records",
  },
  {
    id: "owner",
    name: "Owner Dashboard",
    path: "/m/owner",
    permission: "mobile:owner",
    icon: "crown",
    description: "Business KPIs and alerts",
  },
];

export function getAppsForRole(role: string): MobileAppConfig[] {
  return MOBILE_APPS.filter((app) => hasPermission(role, app.permission));
}

export function getDefaultAppForRole(role: string): MobileAppConfig | null {
  const apps = getAppsForRole(role);
  if (role === "DELIVERY") return apps.find((a) => a.id === "delivery") ?? apps[0] ?? null;
  if (role === "FARM_MANAGER" || role === "IOT_OPERATOR")
    return apps.find((a) => a.id === "farm") ?? apps[0] ?? null;
  if (role === "VETERINARIAN") return apps.find((a) => a.id === "vet") ?? apps[0] ?? null;
  if (role === "OWNER" || role === "ADMIN")
    return apps.find((a) => a.id === "owner") ?? apps[0] ?? null;
  return apps.find((a) => a.id === "customer") ?? apps[0] ?? null;
}

export const DEEP_LINK_PREFIX = "ssd://";
export const DEEP_LINK_BASE =
  process.env.NEXT_PUBLIC_APP_URL || "https://shree-shyam-dairy-farm.vercel.app";

export function resolveDeepLink(path: string): string {
  if (path.startsWith(DEEP_LINK_PREFIX)) {
    return path.replace(DEEP_LINK_PREFIX, `${DEEP_LINK_BASE}/m/`);
  }
  if (path.startsWith("/m/")) return `${DEEP_LINK_BASE}${path}`;
  return `${DEEP_LINK_BASE}/m${path.startsWith("/") ? path : `/${path}`}`;
}

export function parseDeepLinkParam(ref: string | null): string | null {
  if (!ref) return null;
  try {
    if (ref.startsWith("ssd://")) return ref.replace("ssd://", "/m/");
    if (ref.startsWith("/m/")) return ref;
    return `/m/${ref}`;
  } catch {
    return null;
  }
}
