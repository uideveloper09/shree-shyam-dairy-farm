/**
 * Application-wide constants — static values and re-exports from domain constant modules.
 * Runtime env-derived values live on AppConfig; this module holds stable identifiers.
 */

export { AUTH_COOKIE_NAMES } from "./auth";

/** Guest cart localStorage key */
export const GUEST_CART_KEY = "ssd_guest_cart_id" as const;

/** Multi-tenant HTTP/cookie identifiers */
export const TENANT_HEADER = "x-tenant-slug" as const;
export const TENANT_COOKIE = "ssd_tenant" as const;

/** Farm / device integration */
export const FARM_API_KEY_HEADER = "x-farm-api-key" as const;

/** Default service identifiers */
export const SERVICE_NAME = "shree-shyam-erp" as const;

/** Re-export business constants (tenant plans, locales, tax templates) */
export {
  DEFAULT_TENANT_SLUG,
  TENANT_PLANS,
  SUPPORTED_LOCALES,
  SUPPORTED_CURRENCIES,
  SUPPORTED_COUNTRIES,
  GLOBAL_TAX_TEMPLATES,
  type TenantPlan,
  type SupportedLocale,
  type SupportedCurrency,
} from "@/constants/tenant";

export type RuntimeConstants = {
  guestCartKey: typeof GUEST_CART_KEY;
  tenantHeader: typeof TENANT_HEADER;
  tenantCookie: typeof TENANT_COOKIE;
  farmApiKeyHeader: typeof FARM_API_KEY_HEADER;
  serviceName: typeof SERVICE_NAME;
};

export const RUNTIME_CONSTANTS: RuntimeConstants = {
  guestCartKey: GUEST_CART_KEY,
  tenantHeader: TENANT_HEADER,
  tenantCookie: TENANT_COOKIE,
  farmApiKeyHeader: FARM_API_KEY_HEADER,
  serviceName: SERVICE_NAME,
};
