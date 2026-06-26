import { describe, it, expect } from "vitest";
import { hashSignature } from "@/modules/documents/signature";
import { CATEGORY_LABELS, DEFAULT_FOLDERS } from "@/modules/documents/types";
import { hasPermission } from "@/lib/security/permissions";

describe("documents/signature", () => {
  it("hashes signature deterministically", () => {
    const a = hashSignature("data", "doc1", "user1");
    const b = hashSignature("data", "doc1", "user1");
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
  });

  it("differs for different signers", () => {
    const a = hashSignature("data", "doc1", "user1");
    const b = hashSignature("data", "doc1", "user2");
    expect(a).not.toBe(b);
  });
});

describe("documents/types", () => {
  it("labels all categories", () => {
    expect(CATEGORY_LABELS.INVOICE).toBe("Invoices");
    expect(CATEGORY_LABELS.VACCINATION).toBe("Vaccination Documents");
  });

  it("has default folders for each category type", () => {
    expect(DEFAULT_FOLDERS.length).toBeGreaterThanOrEqual(6);
    expect(DEFAULT_FOLDERS.some((f) => f.category === "CONTRACT")).toBe(true);
  });
});

describe("documents/permissions", () => {
  it("grants admin document write", () => {
    expect(hasPermission("ADMIN", "admin:documents:write")).toBe(true);
  });

  it("grants accountant document access", () => {
    expect(hasPermission("ACCOUNTANT", "documents:write")).toBe(true);
    expect(hasPermission("ACCOUNTANT", "documents:sign")).toBe(true);
  });

  it("allows customer read only", () => {
    expect(hasPermission("CUSTOMER", "documents:read")).toBe(true);
    expect(hasPermission("CUSTOMER", "admin:documents:write")).toBe(false);
  });
});
