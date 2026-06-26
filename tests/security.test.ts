import { describe, it, expect } from "vitest";
import { hasPermission, getRolePermissions } from "@/lib/security/permissions";
import { evaluateAbac } from "@/lib/security/abac";
import { validatePasswordPolicy } from "@/lib/security/password-policy";
import { detectBot } from "@/lib/security/bot-detection";
import { verifyTotp, generateTotpSecret } from "@/lib/security/totp";
import { encrypt, decrypt } from "@/lib/security/encryption";

describe("security/permissions", () => {
  it("grants admin all permissions", () => {
    expect(hasPermission("ADMIN", "admin:security:write")).toBe(true);
  });

  it("restricts customer from admin", () => {
    expect(hasPermission("CUSTOMER", "admin:farm:read")).toBe(false);
  });

  it("farm manager can read security dashboard", () => {
    expect(hasPermission("FARM_MANAGER", "admin:security:read")).toBe(true);
  });

  it("returns permissions for delivery role", () => {
    expect(getRolePermissions("DELIVERY")).toContain("delivery:read");
  });
});

describe("security/abac", () => {
  it("denies non-owner resource access", () => {
    const result = evaluateAbac(
      {
        actorId: "u1",
        actorRole: "CUSTOMER",
        resourceOwnerId: "u2",
        action: "read",
      },
      "orders:read"
    );
    expect(result.allowed).toBe(false);
  });

  it("allows owner resource access", () => {
    const result = evaluateAbac(
      {
        actorId: "u1",
        actorRole: "CUSTOMER",
        resourceOwnerId: "u1",
        action: "read",
      },
      "orders:read"
    );
    expect(result.allowed).toBe(true);
  });
});

describe("security/password-policy", () => {
  it("rejects weak passwords", () => {
    const result = validatePasswordPolicy("password");
    expect(result.valid).toBe(false);
  });

  it("accepts strong passwords", () => {
    const result = validatePasswordPolicy("Shree@2026Farm");
    expect(result.valid).toBe(true);
  });
});

describe("security/bot-detection", () => {
  it("flags curl user agents", () => {
    const req = new Request("http://localhost", {
      headers: { "user-agent": "curl/8.0" },
    });
    expect(detectBot(req).isBot).toBe(true);
  });
});

describe("security/totp", () => {
  it("rejects invalid codes", () => {
    const secret = generateTotpSecret();
    expect(verifyTotp(secret, "000000")).toBe(false);
  });
});

describe("security/encryption", () => {
  it("round-trips encrypt/decrypt", () => {
    const plain = "totp-secret-value";
    expect(decrypt(encrypt(plain))).toBe(plain);
  });
});
