import { describe, it, expect } from "vitest";
import { renderTemplate, extractTemplateVariables } from "@/modules/notifications/render";
import { PRIORITY_WEIGHT, RETRY_DELAYS_MS } from "@/modules/notifications/types";
import { hasPermission } from "@/lib/security/permissions";

describe("notifications/render", () => {
  it("renders template variables", () => {
    const out = renderTemplate("Hello {{name}}, order {{orderNumber}}", {
      name: "Ravi",
      orderNumber: "SSD-001",
    });
    expect(out).toBe("Hello Ravi, order SSD-001");
  });

  it("extracts variable names", () => {
    expect(extractTemplateVariables("Hi {{name}}, {{orderNumber}}")).toEqual([
      "name",
      "orderNumber",
    ]);
  });
});

describe("notifications/types", () => {
  it("assigns higher weight to urgent priority", () => {
    expect(PRIORITY_WEIGHT.URGENT).toBeGreaterThan(PRIORITY_WEIGHT.NORMAL);
  });

  it("has retry delay ladder", () => {
    expect(RETRY_DELAYS_MS.length).toBeGreaterThanOrEqual(3);
    expect(RETRY_DELAYS_MS[0]).toBeLessThan(RETRY_DELAYS_MS[1]);
  });
});

describe("notifications/permissions", () => {
  it("grants admin notification write", () => {
    expect(hasPermission("ADMIN", "admin:notifications:write")).toBe(true);
  });

  it("grants customer notification read", () => {
    expect(hasPermission("CUSTOMER", "notifications:read")).toBe(true);
  });

  it("denies customer notification admin", () => {
    expect(hasPermission("CUSTOMER", "admin:notifications:read")).toBe(false);
  });
});
