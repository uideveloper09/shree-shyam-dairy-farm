import { describe, it, expect } from "vitest";
import { metrics } from "@/lib/ops/metrics";
import { getAppEnv } from "@/config/env";
import { sanitizeSearchInput } from "@/lib/ops/security";
import { getCspHeader } from "@/lib/ops/security";

describe("ops/metrics", () => {
  it("exports prometheus format", () => {
    metrics.increment("test_counter", 1);
    const output = metrics.toPrometheus();
    expect(output).toContain("ssd_uptime_seconds");
    expect(output).toContain("test_counter");
  });
});

describe("ops/env", () => {
  it("returns development by default in test", () => {
    expect(["development", "testing", "production", "staging"]).toContain(getAppEnv());
  });
});

describe("ops/security", () => {
  it("sanitizes SQL injection patterns", () => {
    expect(sanitizeSearchInput("'; DROP TABLE users;--")).not.toContain("DROP");
  });

  it("generates CSP header", () => {
    const csp = getCspHeader(false);
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("razorpay.com");
  });
});
