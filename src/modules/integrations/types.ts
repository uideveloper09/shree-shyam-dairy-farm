import type { IntegrationProvider } from "@prisma/client";

export type IntegrationCategory =
  | "payments"
  | "tax"
  | "messaging"
  | "maps"
  | "analytics"
  | "shipping"
  | "accounting"
  | "platform";

export type ProviderStatus = {
  configured: boolean;
  status: "active" | "inactive" | "pending";
  message?: string;
  envKeys: string[];
};

export type IntegrationProviderAdapter = {
  id: IntegrationProvider;
  name: string;
  category: IntegrationCategory;
  description: string;
  isConfigured: () => boolean;
  getStatus: () => ProviderStatus;
  handleWebhook?: (
    headers: Headers,
    body: string
  ) => Promise<{ ok: boolean; event?: string; data?: unknown }>;
  verifyWebhook?: (headers: Headers, body: string) => boolean;
};

export type PluginContext = {
  tenantId?: string | null;
  userId?: string;
  payload?: Record<string, unknown>;
};

export type IntegrationPluginHandler = {
  slug: string;
  name: string;
  version: string;
  provider?: IntegrationProvider;
  hooks: string[];
  execute: (hook: string, ctx: PluginContext) => Promise<unknown>;
};

export const PROVIDER_LABELS: Record<IntegrationProvider, string> = {
  RAZORPAY: "Razorpay",
  PHONEPE: "PhonePe",
  CASHFREE: "Cashfree",
  GST: "GST APIs",
  WHATSAPP: "WhatsApp Business",
  GOOGLE_MAPS: "Google Maps",
  FIREBASE: "Firebase",
  GOOGLE_ANALYTICS: "Google Analytics",
  META_PIXEL: "Meta Pixel",
  SHIPROCKET: "Shiprocket",
  DELHIVERY: "Delhivery",
  INDIA_POST: "India Post",
  SAP: "SAP",
  TALLY: "Tally",
  QUICKBOOKS: "QuickBooks",
};
