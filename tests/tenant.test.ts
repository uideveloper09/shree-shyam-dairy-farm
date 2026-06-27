import { describe, it, expect } from "vitest";
import { TENANT_PLANS, DEFAULT_TENANT_SLUG, SUPPORTED_LOCALES } from "@/constants/tenant";
import { resolveTenantFromHost } from "@/lib/tenant/resolve";
import { tenantFarmId } from "@/lib/tenant/isolation";
import { t, getMessages } from "@/lib/tenant/i18n";
import { themeToCssVars } from "@/lib/tenant/server";

describe("tenant/constants", () => {
  it("has default tenant slug", () => {
    expect(DEFAULT_TENANT_SLUG).toBe("default");
  });

  it("defines plans with limits", () => {
    expect(TENANT_PLANS.starter.limits.api_calls).toBe(10_000);
    expect(TENANT_PLANS.enterprise.limits.api_calls).toBe(-1);
  });
});

describe("tenant/resolve", () => {
  it("resolves subdomain", () => {
    expect(resolveTenantFromHost("farm1.kunwardairy.com")).toBe("farm1");
  });

  it("returns default for main domain", () => {
    expect(resolveTenantFromHost("kunwardairy.com")).toBe("default");
  });
});

describe("tenant/isolation", () => {
  it("maps tenant to farmId", () => {
    expect(
      tenantFarmId({ id: "1", slug: "acme", name: "Acme", plan: "starter", farmId: "acme" })
    ).toBe("acme");
  });
});

describe("tenant/i18n", () => {
  it("translates hindi", () => {
    expect(t("hi", "nav.home")).toBe("होम");
  });

  it("falls back to english", () => {
    expect(t("xx", "nav.home")).toBe("Home");
  });

  it("exports messages", () => {
    expect(getMessages("hi")["cta.order"]).toContain("ऑर्डर");
  });
});

describe("tenant/theme", () => {
  it("converts theme to css vars", () => {
    const vars = themeToCssVars({ primaryColor: "#111", accentColor: "#222" });
    expect(vars["--navy"]).toBe("#111");
    expect(vars["--gold"]).toBe("#222");
  });
});

describe("tenant/locales", () => {
  it("supports en and hi", () => {
    expect(SUPPORTED_LOCALES).toContain("en");
    expect(SUPPORTED_LOCALES).toContain("hi");
  });
});
