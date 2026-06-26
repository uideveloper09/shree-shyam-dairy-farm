import { NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/auth/session";
import { qrDataUrl } from "@/modules/processing/labels";
import {
  generateLabelsForPackaging,
  getLabelByBarcode,
  listLabels,
} from "@/services/processing/service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireAnyPermission(["processing:read", "admin:processing:read"]);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const barcode = searchParams.get("barcode");
  const batchId = searchParams.get("batchId") ?? undefined;
  const expiring = searchParams.get("expiringDays");

  if (barcode) {
    const label = await getLabelByBarcode(barcode);
    if (!label) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (searchParams.get("qr") === "1") {
      const qr = await qrDataUrl(label.qrPayload);
      return NextResponse.json({ label, qr });
    }
    return NextResponse.json(label);
  }

  const labels = await listLabels(batchId, expiring ? Number(expiring) : undefined);
  return NextResponse.json({ labels });
}

export async function POST(request: Request) {
  const auth = await requireAnyPermission(["processing:write", "admin:processing:write"]);
  if (auth.error) return auth.error;

  const body = await request.json();
  if (!body.packagingId) {
    return NextResponse.json({ error: "packagingId required" }, { status: 400 });
  }

  const labels = await generateLabelsForPackaging(body.packagingId, body.count ?? 1);
  return NextResponse.json({ labels }, { status: 201 });
}
