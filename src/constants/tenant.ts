export const DEFAULT_TENANT_SLUG = process.env.DEFAULT_TENANT_SLUG || "default";

export const TENANT_HEADER = "x-tenant-slug";
export const TENANT_COOKIE = "ssd_tenant";

export type TenantPlan = "starter" | "growth" | "enterprise";

export const TENANT_PLANS: Record<
  TenantPlan,
  { name: string; priceInr: number; limits: Record<string, number> }
> = {
  starter: {
    name: "Starter",
    priceInr: 0,
    limits: { api_calls: 10_000, orders: 500, users: 10, storage_mb: 500 },
  },
  growth: {
    name: "Growth",
    priceInr: 4_999,
    limits: { api_calls: 100_000, orders: 5_000, users: 50, storage_mb: 5_000 },
  },
  enterprise: {
    name: "Enterprise",
    priceInr: 19_999,
    limits: { api_calls: -1, orders: -1, users: -1, storage_mb: -1 },
  },
};

export const SUPPORTED_LOCALES = ["en", "hi", "ar", "gu", "mr"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const SUPPORTED_CURRENCIES = ["INR", "USD", "EUR", "AED", "GBP"] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export const SUPPORTED_COUNTRIES = [
  { code: "IN", name: "India", currency: "INR" },
  { code: "US", name: "United States", currency: "USD" },
  { code: "AE", name: "UAE", currency: "AED" },
  { code: "GB", name: "United Kingdom", currency: "GBP" },
  { code: "DE", name: "Germany", currency: "EUR" },
] as const;

export const GLOBAL_TAX_TEMPLATES = {
  IN: { name: "GST", type: "GST", rate: 5, hsn: "0401" },
  US: { name: "Sales Tax", type: "SALES", rate: 7 },
  AE: { name: "VAT", type: "VAT", rate: 5 },
  GB: { name: "VAT", type: "VAT", rate: 20 },
  DE: { name: "VAT", type: "VAT", rate: 19 },
} as const;
