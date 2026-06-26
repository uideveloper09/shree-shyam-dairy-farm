import { describe, it, expect, afterEach } from "vitest";
import { validateEnv, validateConfigAtStartup, resetConfigCache } from "@/config";

describe("config", () => {
  const original = { ...process.env };

  afterEach(() => {
    process.env = { ...original };
    resetConfigCache();
  });

  it("validates PostgreSQL DATABASE_URL format", () => {
    process.env.DATABASE_URL = "mysql://bad";
    const result = validateEnv({ strict: false });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("DATABASE_URL"))).toBe(true);
  });

  it("accepts valid DATABASE_URL", () => {
    process.env.DATABASE_URL = "postgresql://u:p@host:5432/db?sslmode=require";
    process.env.JWT_ACCESS_SECRET = "a".repeat(32);
    const result = validateEnv({ strict: false });
    expect(result.errors.filter((e) => e.includes("DATABASE_URL"))).toHaveLength(0);
    expect(result.config.database.configured).toBe(true);
  });

  it("maps NEXTAUTH_SECRET to JWT_ACCESS_SECRET", () => {
    process.env.NEXTAUTH_SECRET = "b".repeat(32);
    delete process.env.JWT_ACCESS_SECRET;
    const result = validateEnv({ strict: false });
    expect(result.config.auth.jwt.accessSecret).toBe("b".repeat(32));
  });

  it("maps NEXTAUTH_URL to app url", () => {
    process.env.NEXTAUTH_URL = "https://example.com";
    delete process.env.NEXT_PUBLIC_APP_URL;
    const result = validateEnv({ strict: false });
    expect(result.config.app.public.url).toBe("https://example.com");
  });

  it("requires both Razorpay keys when one is set", () => {
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = "rzp_test_abc";
    delete process.env.RAZORPAY_KEY_SECRET;
    const result = validateEnv({ strict: false });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("RAZORPAY"))).toBe(true);
  });

  it("detects configured Razorpay", () => {
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = "rzp_test_abc";
    process.env.RAZORPAY_KEY_SECRET = "secret123";
    const result = validateEnv({ strict: false });
    expect(result.config.payment.razorpay.configured).toBe(true);
  });

  it("validates OPENAI_API_KEY prefix", () => {
    process.env.OPENAI_API_KEY = "not-a-key";
    const result = validateEnv({ strict: false });
    expect(result.errors.some((e) => e.includes("OPENAI"))).toBe(true);
  });

  it("requires EMAIL_FROM when RESEND_API_KEY is set", () => {
    process.env.RESEND_API_KEY = "re_real_key";
    delete process.env.EMAIL_FROM;
    const result = validateEnv({ strict: false });
    expect(result.errors.some((e) => e.includes("EMAIL_FROM"))).toBe(true);
  });

  it("enforces production requirements", () => {
    process.env.APP_ENV = "production";
    delete process.env.DATABASE_URL;
    delete process.env.JWT_ACCESS_SECRET;
    delete process.env.ADMIN_SECRET;
    const result = validateEnv({ strict: true });
    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });

  it("validateConfigAtStartup does not throw in development", async () => {
    process.env.APP_ENV = "development";
    delete process.env.DATABASE_URL;
    await expect(validateConfigAtStartup()).resolves.toMatchObject({ ok: expect.any(Boolean) });
  });
});
