import { describe, it, expect, afterEach } from "vitest";
import { getSiteUrl, getPublicApiBaseUrl, getAppDomain, getAppApiBaseUrl } from "@/lib/site-url";

describe("site-url", () => {
  const original = { ...process.env };

  afterEach(() => {
    process.env = { ...original };
  });

  it("uses NEXT_PUBLIC_APP_URL when set", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://kunwardairy.com/";
    expect(getSiteUrl()).toBe("https://kunwardairy.com");
  });

  it("builds same-origin internal API base URL", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://kunwardairy.com";
    expect(getAppApiBaseUrl()).toBe("https://kunwardairy.com/api/v1");
  });

  it("builds same-origin public API base URL", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://kunwardairy.com";
    expect(getPublicApiBaseUrl()).toBe("https://kunwardairy.com/api/public/v1");
  });

  it("falls back to localhost in development", () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.NEXTAUTH_URL;
    process.env.NODE_ENV = "development";
    expect(getSiteUrl()).toBe("http://localhost:3000");
  });

  it("resolves app domain from env", () => {
    process.env.NEXT_PUBLIC_APP_DOMAIN = "kunwardairy.com";
    expect(getAppDomain()).toBe("kunwardairy.com");
  });
});
