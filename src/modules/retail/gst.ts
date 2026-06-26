import type { BillLineInput } from "@/modules/retail/types";

export type GstBreakdown = {
  subtotal: number;
  discount: number;
  taxable: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
  lines: {
    name: string;
    taxable: number;
    cgst: number;
    sgst: number;
    lineTotal: number;
  }[];
};

export function calculateGst(
  lines: BillLineInput[],
  discountAmount = 0,
  isInterState = false
): GstBreakdown {
  const lineCalcs = lines.map((l) => {
    const gross = l.quantity * l.unitPrice - (l.discount ?? 0);
    const rate = (l.taxRate ?? 5) / 100;
    const tax = gross * rate;
    const cgst = isInterState ? 0 : tax / 2;
    const sgst = isInterState ? 0 : tax / 2;
    const igst = isInterState ? tax : 0;
    return {
      name: l.name,
      taxable: gross,
      cgst,
      sgst,
      igst,
      lineTotal: gross + tax,
    };
  });

  const subtotal = lineCalcs.reduce((s, l) => s + l.taxable, 0);
  const ratio = subtotal > 0 ? Math.min(discountAmount / subtotal, 1) : 0;

  const adjusted = lineCalcs.map((l) => {
    const disc = l.taxable * ratio;
    const taxable = l.taxable - disc;
    const taxMult = l.cgst + l.sgst + l.igst > 0 ? (l.cgst + l.sgst + l.igst) / l.taxable : 0;
    const tax = taxable * (taxMult || 0.05);
    return {
      ...l,
      taxable,
      cgst: isInterState ? 0 : tax / 2,
      sgst: isInterState ? 0 : tax / 2,
      lineTotal: taxable + tax,
    };
  });

  const cgst = adjusted.reduce((s, l) => s + l.cgst, 0);
  const sgst = adjusted.reduce((s, l) => s + l.sgst, 0);
  const igst = isInterState ? adjusted.reduce((s, l) => s + l.taxable * 0.05, 0) : 0;
  const taxable = adjusted.reduce((s, l) => s + l.taxable, 0);
  const total = taxable + cgst + sgst + igst;

  return {
    subtotal: round2(subtotal),
    discount: round2(discountAmount),
    taxable: round2(taxable),
    cgst: round2(cgst),
    sgst: round2(sgst),
    igst: round2(igst),
    total: round2(total),
    lines: adjusted.map((l) => ({
      name: l.name,
      taxable: round2(l.taxable),
      cgst: round2(l.cgst),
      sgst: round2(l.sgst),
      lineTotal: round2(l.lineTotal),
    })),
  };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function generateInvoiceNumber(billNumber: string) {
  const year = new Date().getFullYear();
  const seq = billNumber.replace(/\D/g, "").slice(-6).padStart(6, "0");
  return `INV/${year}/${seq}`;
}
