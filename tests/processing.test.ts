import { describe, it, expect } from "vitest";
import { generateBarcode, buildQrPayload, batchNumber } from "@/modules/processing/labels";
import {
  DAIRY_PRODUCT_TYPES,
  PRODUCT_TYPE_LABELS,
  BATCH_STATUS_LABELS,
  QC_STATUS_LABELS,
  DEFAULT_QC_CHECKS,
} from "@/modules/processing/types";
import { hasPermission } from "@/lib/security/permissions";

describe("processing/labels", () => {
  it("generates batch number with product code", () => {
    const num = batchNumber("PANEER");
    expect(num).toMatch(/^BATCH-PAN-/);
  });

  it("generates 13-char barcode", () => {
    const bc = generateBarcode("BATCH-PAN-2025-DEMO", 1);
    expect(bc.startsWith("890")).toBe(true);
    expect(bc.length).toBeLessThanOrEqual(13);
  });

  it("builds traceable QR payload", () => {
    const payload = buildQrPayload({
      batchNumber: "BATCH-PAN-2025-ABC",
      productType: "PANEER",
      barcode: "8901234567890",
      expiryDate: "2026-01-15",
    });
    const parsed = JSON.parse(payload);
    expect(parsed.brand).toBe("Shree Shyam Dairy Farm");
    expect(parsed.batch).toBe("BATCH-PAN-2025-ABC");
    expect(parsed.trace).toContain("trace");
  });
});

describe("processing/types", () => {
  it("lists all dairy product types", () => {
    expect(DAIRY_PRODUCT_TYPES).toContain("PANEER");
    expect(DAIRY_PRODUCT_TYPES).toContain("FLAVOURED_MILK");
    expect(DAIRY_PRODUCT_TYPES.length).toBe(7);
  });

  it("labels product and batch statuses", () => {
    expect(PRODUCT_TYPE_LABELS.GHEE).toBe("Ghee");
    expect(BATCH_STATUS_LABELS.QC_PENDING).toBe("QC Pending");
    expect(QC_STATUS_LABELS.PASSED).toBe("Passed");
  });

  it("defines QC templates for paneer and ghee", () => {
    expect(DEFAULT_QC_CHECKS.PANEER?.length).toBeGreaterThan(0);
    expect(DEFAULT_QC_CHECKS.GHEE?.[0].parameter).toBe("Moisture %");
  });
});

describe("processing/permissions", () => {
  it("grants farm manager processing admin", () => {
    expect(hasPermission("FARM_MANAGER", "admin:processing:write")).toBe(true);
    expect(hasPermission("IOT_OPERATOR", "processing:write")).toBe(true);
  });

  it("denies customer processing access", () => {
    expect(hasPermission("CUSTOMER", "processing:read")).toBe(false);
  });
});
