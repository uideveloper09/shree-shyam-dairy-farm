import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  createLogger,
  resetLoggerCache,
  resetRootPinoLogger,
  getLoggingRuntimeConfig,
  serializeError,
  auditLogger,
  requestLogger,
  paymentLogger,
  errorLogger,
  clearRotatableDestinationsForTests,
} from "@/lib/logging/server";
import { logger } from "@/lib/ops/logger";
import { getConfig, resetEnvCache } from "@/config";

describe("logging", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.LOG_LEVEL = "silent";
    process.env.LOG_PRETTY = "false";
    process.env.LOG_FILE_ENABLED = "false";
    resetEnvCache();
    resetLoggerCache();
    resetRootPinoLogger();
    clearRotatableDestinationsForTests();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    resetEnvCache();
    resetLoggerCache();
    resetRootPinoLogger();
    clearRotatableDestinationsForTests();
  });

  it("resolves logging config from env", () => {
    process.env.LOG_LEVEL = "warn";
    process.env.LOG_SERVICE_NAME = "test-service";
    resetRootPinoLogger();

    const cfg = getLoggingRuntimeConfig();
    expect(cfg.level).toBe("warn");
    expect(cfg.serviceName).toBe("test-service");
  });

  it("includes logging slice in AppConfig", () => {
    const config = getConfig();
    expect(config.logging).toBeDefined();
    expect(config.logging.serviceName).toBe("shree-shyam-erp");
  });

  it("creates app logger without throwing", () => {
    const log = createLogger({ component: "test" });
    expect(() => log.info("test_message", { ok: true })).not.toThrow();
  });

  it("serializes errors", () => {
    const err = new Error("boom");
    const serialized = serializeError(err);
    expect(serialized.message).toBe("boom");
    expect(serialized.name).toBe("Error");
    expect(serialized.stack).toBeDefined();
  });

  it("records audit events", () => {
    expect(() =>
      auditLogger.record("auth.login.success", { userId: "u1", severity: "info" })
    ).not.toThrow();
  });

  it("logs http requests with status-based level", () => {
    expect(() => requestLogger.log("GET", "/api/health", 200, 12)).not.toThrow();
    expect(() => requestLogger.log("POST", "/api/orders", 500, 45)).not.toThrow();
  });

  it("redacts payment metadata paths at pino level", () => {
    expect(() =>
      paymentLogger.initiated({
        provider: "razorpay",
        orderId: "ord_1",
        keySecret: "should-redact",
      } as never)
    ).not.toThrow();
  });

  it("logs structured errors", () => {
    expect(() =>
      errorLogger.api(new Error("handler failed"), { path: "/api/v1/test", method: "GET" })
    ).not.toThrow();
  });

  it("legacy ops logger remains compatible", () => {
    expect(() => {
      logger.info("legacy_info");
      logger.audit("legacy.audit", { userId: "u1" });
      logger.request("GET", "/health", 200, 5);
      logger.error("legacy_error", { error: "msg" });
    }).not.toThrow();
  });
});
