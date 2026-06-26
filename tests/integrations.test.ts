import { describe, it, expect } from "vitest";
import { getAllProviders, getProvider, getProviderCatalog } from "@/modules/integrations/registry";
import { PROVIDER_LABELS } from "@/modules/integrations/types";
import { executeGraphQL, GRAPHQL_SCHEMA } from "@/modules/integrations/graphql/handler";
import { hasPermission } from "@/lib/security/permissions";

describe("integrations/registry", () => {
  it("registers all 15 providers", () => {
    expect(getAllProviders().length).toBe(15);
  });

  it("includes Razorpay", () => {
    const rp = getProvider("RAZORPAY");
    expect(rp?.name).toBe("Razorpay");
    expect(rp?.category).toBe("payments");
  });

  it("returns catalog with status", () => {
    const catalog = getProviderCatalog();
    expect(catalog.length).toBe(15);
    expect(catalog[0]).toHaveProperty("status");
  });
});

describe("integrations/types", () => {
  it("labels all providers", () => {
    expect(Object.keys(PROVIDER_LABELS).length).toBe(15);
    expect(PROVIDER_LABELS.SHIPROCKET).toBe("Shiprocket");
  });
});

describe("integrations/graphql", () => {
  it("exports schema", () => {
    expect(GRAPHQL_SCHEMA).toContain("integrationCatalog");
    expect(GRAPHQL_SCHEMA).toContain("products");
  });

  it("executes integrationCatalog query", async () => {
    const result = await executeGraphQL("{ integrationCatalog { id name configured } }");
    expect(result.data?.integrationCatalog).toBeDefined();
    expect(Array.isArray(result.data?.integrationCatalog)).toBe(true);
  });

  it("executes health query", async () => {
    const result = await executeGraphQL("{ health { status integrations } }");
    expect(result.data?.health).toEqual({ status: "ok", integrations: 15 });
  });
});

describe("integrations/permissions", () => {
  it("grants admin integrations access", () => {
    expect(hasPermission("ADMIN", "admin:integrations:write")).toBe(true);
  });

  it("denies customer integrations admin", () => {
    expect(hasPermission("CUSTOMER", "admin:integrations:read")).toBe(false);
  });
});
