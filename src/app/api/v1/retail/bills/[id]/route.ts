import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { getBill, getGstInvoice } from "@/services/retail/service";
import { formatThermalReceipt, CASH_DRAWER_OPEN, qrDataUrl } from "@/modules/retail/printer";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission("retail:read");
  if (auth.error) return auth.error;

  const { id } = await params;
  const { searchParams } = new URL(request.url);

  if (searchParams.get("invoice") === "1") {
    const invoice = await getGstInvoice(id);
    if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(invoice);
  }

  if (searchParams.get("print") === "1") {
    const bill = await getBill(id);
    if (!bill) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const receipt = formatThermalReceipt(bill);
    return NextResponse.json({
      receipt,
      cashDrawerCommand: bill.cashDrawerOpened ? CASH_DRAWER_OPEN : null,
      printerWidth: bill.terminal?.printerWidth ?? 80,
    });
  }

  if (searchParams.get("qr") === "1") {
    const bill = await getBill(id);
    if (!bill?.billQrPayload) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const qr = await qrDataUrl(bill.billQrPayload);
    return NextResponse.json({ qr, payload: bill.billQrPayload });
  }

  const bill = await getBill(id);
  if (!bill) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(bill);
}
