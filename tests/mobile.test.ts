import { describe, it, expect } from "vitest";
import {
  getAppsForRole,
  getDefaultAppForRole,
  parseDeepLinkParam,
  resolveDeepLink,
} from "@/lib/mobile/apps";

describe("mobile/apps", () => {
  it("returns customer app for CUSTOMER role", () => {
    const apps = getAppsForRole("CUSTOMER");
    expect(apps.some((a) => a.id === "customer")).toBe(true);
  });

  it("returns delivery app for DELIVERY role", () => {
    const apps = getAppsForRole("DELIVERY");
    expect(apps.some((a) => a.id === "delivery")).toBe(true);
  });

  it("defaults delivery role to delivery app", () => {
    expect(getDefaultAppForRole("DELIVERY")?.id).toBe("delivery");
  });

  it("defaults owner to owner dashboard", () => {
    expect(getDefaultAppForRole("OWNER")?.id).toBe("owner");
  });

  it("parses deep link refs", () => {
    expect(parseDeepLinkParam("ssd://delivery")).toBe("/m/delivery");
    expect(parseDeepLinkParam("/m/customer")).toBe("/m/customer");
  });

  it("resolves deep links to URLs", () => {
    expect(resolveDeepLink("ssd://customer")).toContain("/m/customer");
  });
});
