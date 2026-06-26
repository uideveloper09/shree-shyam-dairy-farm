import { randomBytes } from "crypto";
import QRCode from "qrcode";
import type { ProcProductType } from "@prisma/client";

export function batchNumber(productType: ProcProductType) {
  const code = productType.slice(0, 3).toUpperCase();
  return `BATCH-${code}-${new Date().getFullYear()}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

export function generateBarcode(batchNumber: string, seq: number) {
  const base = batchNumber.replace(/[^A-Z0-9]/g, "").slice(0, 8);
  return `890${base}${String(seq).padStart(4, "0")}`.slice(0, 13);
}

export function buildQrPayload(data: {
  batchNumber: string;
  productType: string;
  barcode: string;
  expiryDate: string;
  qty?: string;
}) {
  return JSON.stringify({
    v: 1,
    brand: "Shree Shyam Dairy Farm",
    batch: data.batchNumber,
    product: data.productType,
    barcode: data.barcode,
    expiry: data.expiryDate,
    qty: data.qty,
    trace: `https://shree-shyam-dairy-farm.vercel.app/trace/${data.batchNumber}`,
  });
}

export async function qrDataUrl(payload: string) {
  return QRCode.toDataURL(payload, { margin: 1, width: 200 });
}
