import { describe, it, expect } from "vitest";
import { hasScope, WEBHOOK_EVENTS, TIER_RATE_LIMITS } from "@/lib/api/scopes";
import { getKeyPrefix, generateApiKeyValue } from "@/lib/api/auth";
import { buildOpenApiSpec } from "@/lib/api/openapi";
import { signWebhookPayload, verifyWebhookSignature } from "@/lib/api/webhooks";
import { API_VERSIONS, PUBLIC_API_BASE } from "@/lib/api/versioning";

describe("api/scopes", () => {
  it("checks scopes", () => {
    expect(hasScope(["read:products"], "read:products")).toBe(true);
    expect(hasScope(["read:products"], "read:orders")).toBe(false);
    expect(hasScope(["*"], "read:orders")).toBe(true);
  });

  it("defines webhook events", () => {
    expect(WEBHOOK_EVENTS).toContain("order.created");
  });

  it("defines tier limits", () => {
    expect(TIER_RATE_LIMITS.free).toBe(60);
  });
});

describe("api/auth", () => {
  it("generates ssd prefixed keys", () => {
    const key = generateApiKeyValue("live");
    expect(key.startsWith("ssd_live_")).toBe(true);
    expect(getKeyPrefix(key).length).toBe(16);
  });
});

describe("api/openapi", () => {
  it("builds valid openapi spec", () => {
    const spec = buildOpenApiSpec();
    expect(spec.openapi).toBe("3.1.0");
    expect(spec.paths["/products"]).toBeDefined();
  });
});

describe("api/webhooks", () => {
  it("signs and verifies payloads", () => {
    const secret = "whsec_test";
    const payload = '{"event":"test"}';
    const ts = Math.floor(Date.now() / 1000);
    const sig = signWebhookPayload(secret, payload, ts);
    expect(verifyWebhookSignature(secret, payload, String(ts), `v1=${sig}`)).toBe(true);
  });
});

describe("api/versioning", () => {
  it("exports v1", () => {
    expect(API_VERSIONS).toContain("v1");
    expect(PUBLIC_API_BASE).toBe("/api/public/v1");
  });
});
