export const API_SCOPES = {
  "read:products": "Read product catalog",
  "read:orders": "Read order details",
  "read:subscriptions": "Read subscription data",
  "read:account": "Read developer account",
  "write:webhooks": "Manage webhook endpoints",
  "read:webhooks": "Read webhook delivery logs",
} as const;

export type ApiScope = keyof typeof API_SCOPES;

export const DEFAULT_SCOPES: ApiScope[] = ["read:products", "read:account"];

export const TIER_RATE_LIMITS: Record<string, number> = {
  free: 60,
  pro: 300,
  enterprise: 1000,
};

export const WEBHOOK_EVENTS = [
  "order.created",
  "order.updated",
  "order.delivered",
  "order.cancelled",
  "subscription.created",
  "subscription.updated",
  "subscription.cancelled",
  "product.updated",
  "payment.captured",
  "payment.failed",
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

export function hasScope(granted: string[], required: ApiScope): boolean {
  return granted.includes(required) || granted.includes("*");
}
