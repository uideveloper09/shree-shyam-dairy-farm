import { describe, it, expect } from "vitest";
import { MODULE_LABELS, DOMAIN_MODULES } from "@/modules/ai-platform/types";
import { hasPermission } from "@/lib/security/permissions";

describe("ai-platform/types", () => {
  it("labels all 10 modules", () => {
    expect(Object.keys(MODULE_LABELS).length).toBe(10);
    expect(MODULE_LABELS.CEO).toBe("CEO Dashboard AI");
    expect(MODULE_LABELS.WHATSAPP).toBe("WhatsApp AI");
    expect(MODULE_LABELS.AGENT).toBe("Autonomous AI Agents");
  });

  it("lists domain analysis modules", () => {
    expect(DOMAIN_MODULES).toContain("FINANCE");
    expect(DOMAIN_MODULES).toContain("INVENTORY");
    expect(DOMAIN_MODULES.length).toBe(7);
  });
});

describe("ai-platform/permissions", () => {
  it("grants farm manager full AI access", () => {
    expect(hasPermission("FARM_MANAGER", "admin:ai:write")).toBe(true);
    expect(hasPermission("FARM_MANAGER", "ai:write")).toBe(true);
  });

  it("grants accountant AI read", () => {
    expect(hasPermission("ACCOUNTANT", "ai:read")).toBe(true);
    expect(hasPermission("ACCOUNTANT", "admin:ai:write")).toBe(false);
  });

  it("denies customer AI admin", () => {
    expect(hasPermission("CUSTOMER", "ai:read")).toBe(false);
  });
});
