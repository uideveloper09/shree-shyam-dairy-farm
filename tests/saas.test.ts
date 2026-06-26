import { describe, it, expect } from "vitest";
import { LISTING_TYPE_LABELS, PARTNER_TYPE_LABELS } from "@/modules/saas/types";
import { calculateShipping } from "@/services/saas/service";
import { GLOBAL_TAX_TEMPLATES } from "@/constants/tenant";
import { hasPermission } from "@/lib/security/permissions";

describe("saas/types", () => {
  it("labels listing types", () => {
    expect(LISTING_TYPE_LABELS.APP).toBe("App");
    expect(LISTING_TYPE_LABELS.API).toBe("API");
    expect(Object.keys(LISTING_TYPE_LABELS).length).toBe(4);
  });

  it("labels partner types", () => {
    expect(PARTNER_TYPE_LABELS.PARTNER).toBe("Partner");
    expect(PARTNER_TYPE_LABELS.RESELLER).toBe("Reseller");
  });
});

describe("saas/shipping", () => {
  const zones = [
    { countries: ["IN"], baseRate: 49, perKgRate: 12, freeAbove: 999 },
    { countries: ["US"], baseRate: 199, perKgRate: 30, freeAbove: null },
  ];

  it("calculates base + per-kg rate", () => {
    expect(calculateShipping(zones, "IN", 500, 2)).toBe(73);
  });

  it("returns zero when order exceeds free threshold", () => {
    expect(calculateShipping(zones, "IN", 1000, 5)).toBe(0);
  });

  it("returns null for unknown country", () => {
    expect(calculateShipping(zones, "XX", 100)).toBeNull();
  });
});

describe("saas/tax templates", () => {
  it("defines multi-country tax", () => {
    expect(GLOBAL_TAX_TEMPLATES.IN.rate).toBe(5);
    expect(GLOBAL_TAX_TEMPLATES.GB.rate).toBe(20);
    expect(Object.keys(GLOBAL_TAX_TEMPLATES).length).toBeGreaterThanOrEqual(4);
  });
});

describe("saas/permissions", () => {
  it("grants farm manager full SaaS admin", () => {
    expect(hasPermission("FARM_MANAGER", "admin:saas:write")).toBe(true);
    expect(hasPermission("FARM_MANAGER", "saas:write")).toBe(true);
  });

  it("grants accountant regional read", () => {
    expect(hasPermission("ACCOUNTANT", "saas:read")).toBe(true);
    expect(hasPermission("ACCOUNTANT", "admin:saas:write")).toBe(false);
  });

  it("denies customer SaaS access", () => {
    expect(hasPermission("CUSTOMER", "saas:read")).toBe(false);
  });
});
