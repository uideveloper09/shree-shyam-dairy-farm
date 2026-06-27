import { randomBytes } from "crypto";
import QRCode from "qrcode";
import { getAppDomain, getSiteUrl } from "@/lib/site-url";

export function billNumber() {
  return `BILL-${new Date().getFullYear()}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

export function returnNumber() {
  return `RET-${new Date().getFullYear()}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

export function billBarcode(billNumber: string) {
  const base = billNumber.replace(/[^A-Z0-9]/g, "").slice(0, 10);
  return `899${base}`.slice(0, 13);
}

export function buildBillQrPayload(data: {
  billNumber: string;
  total: number;
  invoiceNumber?: string;
  gstin?: string;
}) {
  return JSON.stringify({
    v: 1,
    store: "Shree Shyam Dairy Farm",
    bill: data.billNumber,
    invoice: data.invoiceNumber,
    total: data.total,
    gstin: data.gstin,
    verify: `${getSiteUrl()}/invoice/${data.billNumber}`,
  });
}

export async function qrDataUrl(payload: string) {
  return QRCode.toDataURL(payload, { margin: 1, width: 180 });
}

export function formatThermalReceipt(bill: {
  billNumber: string;
  invoiceNumber?: string | null;
  customerName?: string | null;
  customerGstin?: string | null;
  createdAt: Date;
  items: { name: string; quantity: unknown; unitPrice: unknown; lineTotal: unknown }[];
  subtotal: unknown;
  discountAmount: unknown;
  taxCgst: unknown;
  taxSgst: unknown;
  total: unknown;
  payments: { method: string; amount: unknown }[];
  loyaltyEarned?: number;
  terminal?: { name?: string | null; printerWidth?: number } | null;
}) {
  const width = bill.terminal?.printerWidth ?? 80;
  const line = (s: string) => s.slice(0, width).padEnd(width);
  const center = (s: string) => {
    const pad = Math.max(0, Math.floor((width - s.length) / 2));
    return " ".repeat(pad) + s;
  };
  const money = (n: unknown) => `₹${Number(n).toFixed(2)}`;

  const rows: string[] = [
    center("SHREE SHYAM DAIRY FARM"),
    center("Fresh A2 Milk & Dairy Products"),
    center("GSTIN: 08XXXXX1234X1ZX"),
    "-".repeat(width),
    `Bill: ${bill.billNumber}`,
  ];

  if (bill.invoiceNumber) rows.push(`Invoice: ${bill.invoiceNumber}`);
  if (bill.customerName) rows.push(`Customer: ${bill.customerName}`);
  if (bill.customerGstin) rows.push(`GSTIN: ${bill.customerGstin}`);
  rows.push(`Date: ${bill.createdAt.toLocaleString("en-IN")}`);
  if (bill.terminal?.name) rows.push(`Terminal: ${bill.terminal.name}`);
  rows.push("-".repeat(width));
  rows.push(line("Item           Qty    Amt"));
  rows.push("-".repeat(width));

  for (const item of bill.items) {
    const name = item.name.slice(0, 14).padEnd(14);
    const qty = String(Number(item.quantity)).padStart(4);
    const amt = money(item.lineTotal).padStart(10);
    rows.push(`${name} ${qty} ${amt}`);
  }

  rows.push("-".repeat(width));
  rows.push(line(`Subtotal:${money(bill.subtotal).padStart(width - 9)}`));
  if (Number(bill.discountAmount) > 0) {
    rows.push(line(`Discount:${money(bill.discountAmount).padStart(width - 9)}`));
  }
  rows.push(line(`CGST:    ${money(bill.taxCgst).padStart(width - 9)}`));
  rows.push(line(`SGST:    ${money(bill.taxSgst).padStart(width - 9)}`));
  rows.push(line(`TOTAL:   ${money(bill.total).padStart(width - 9)}`));
  rows.push("-".repeat(width));

  for (const p of bill.payments) {
    rows.push(line(`${p.method}: ${money(p.amount)}`));
  }

  if (bill.loyaltyEarned) {
    rows.push(line(`Points earned: ${bill.loyaltyEarned}`));
  }

  rows.push("-".repeat(width));
  rows.push(center("Thank you! Visit again."));
  rows.push(center(`www.${getAppDomain()}`));
  rows.push("\n\n\n");

  return rows.join("\n");
}

export const CASH_DRAWER_OPEN = "\x1B\x70\x00\x19\xFA";
