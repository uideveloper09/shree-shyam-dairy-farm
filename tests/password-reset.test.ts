import { describe, it, expect } from "vitest";
import {
  generatePasswordResetToken,
  hashPasswordResetToken,
  getPasswordResetUrl,
  PASSWORD_RESET_TOKEN_BYTES,
} from "@/lib/auth/password-reset.service";

describe("auth/password-reset.service", () => {
  it("generates a 64-char hex token from 32 random bytes", () => {
    const token = generatePasswordResetToken();
    expect(token).toMatch(/^[a-f0-9]{64}$/);
    expect(token.length).toBe(PASSWORD_RESET_TOKEN_BYTES * 2);
  });

  it("generates unique tokens", () => {
    const a = generatePasswordResetToken();
    const b = generatePasswordResetToken();
    expect(a).not.toBe(b);
  });

  it("hashes tokens as 64-char SHA-256 hex", () => {
    const token = "abc123";
    const hash = hashPasswordResetToken(token);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hash).toBe(hashPasswordResetToken(token));
    expect(hash).not.toBe(token);
  });

  it("builds reset URL with encoded token", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://kunwardairy.com";
    const url = getPasswordResetUrl("deadbeef");
    expect(url).toBe("https://kunwardairy.com/reset-password?token=deadbeef");
  });
});

describe("auth/password", () => {
  it("hashes passwords with bcrypt", async () => {
    const { hashPassword, verifyPassword } = await import("@/lib/auth/password");
    const hash = await hashPassword("Shree@2026Farm");
    expect(hash).toMatch(/^\$2[aby]\$/);
    expect(await verifyPassword("Shree@2026Farm", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });
});
