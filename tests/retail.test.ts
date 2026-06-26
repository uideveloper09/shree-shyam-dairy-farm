import { describe, it, expect } from "vitest";
import { calculateGst, generateInvoiceNumber } from "@/modules/retail/gst";
import { billBarcode, buildBillQrPayload, formatThermalReceipt } from "@/modules/retail/printer";
import {
  BILL_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  RETURN_TYPE_LABELS,
  LOYALTY_REDEEM_VALUE,
} from "@/modules/retail/types";
import { hasPermission } from "@/lib/security/permissions";

describe("retail/gst", () => {
  it("calculates CGST/SGST on lines", () => {
    const result = calculateGst([{ name: "Paneer", quantity: 2, unitPrice: 100, taxRate: 5 }], 0);
    expect(result.subtotal).toBe(200);
    expect(result.cgst).toBeGreaterThan(0);
    expect(result.sgst).toBeGreaterThan(0);
    expect(result.total).toBeGreaterThan(200);
  });

  it("applies bill-level discount", () => {
    const result = calculateGst([{ name: "Milk", quantity: 1, unitPrice: 100, taxRate: 5 }], 10);
    expect(result.discount).toBe(10);
    expect(result.total).toBeLessThan(105);
  });

  it("generates invoice number", () => {
    expect(generateInvoiceNumber("BILL-2025-ABC123")).toMatch(/^INV\/\d{4}\//);
  });
});

describe("retail/printer", () => {
  it("generates bill barcode", () => {
    expect(billBarcode("BILL-2025-TEST")).toMatch(/^899/);
  });

  it("builds QR payload with verify URL", () => {
    const payload = JSON.parse(buildBillQrPayload({ billNumber: "BILL-1", total: 500 }));
    expect(payload.store).toBe("Shree Shyam Dairy Farm");
    expect(payload.verify).toContain("invoice");
  });

  it("formats thermal receipt", () => {
    const text = formatThermalReceipt({
      billNumber: "BILL-1",
      createdAt: new Date("2025-06-01"),
      items: [{ name: "Ghee", quantity: 1, unitPrice: 500, lineTotal: 525 }],
      subtotal: 500,
      discountAmount: 0,
      taxCgst: 12.5,
      taxSgst: 12.5,
      total: 525,
      payments: [{ method: "CASH", amount: 525 }],
    });
    expect(text).toContain("SHREE SHYAM DAIRY FARM");
    expect(text).toContain("Ghee");
    expect(text).toContain("₹525.00");
  });
});

describe("retail/types", () => {
  it("labels enums", () => {
    expect(BILL_STATUS_LABELS.COMPLETED).toBe("Completed");
    expect(PAYMENT_METHOD_LABELS.UPI).toBe("UPI");
    expect(RETURN_TYPE_LABELS.EXCHANGE).toBe("Exchange");
  });

  it("defines loyalty redeem value", () => {
    expect(LOYALTY_REDEEM_VALUE).toBe(0.5);
  });
});

describe("retail/permissions", () => {
  it("grants farm manager retail admin", () => {
    expect(hasPermission("FARM_MANAGER", "admin:retail:write")).toBe(true);
    expect(hasPermission("ACCOUNTANT", "retail:write")).toBe(true);
  });

  it("denies customer POS access", () => {
    expect(hasPermission("CUSTOMER", "retail:read")).toBe(false);
  });
});
