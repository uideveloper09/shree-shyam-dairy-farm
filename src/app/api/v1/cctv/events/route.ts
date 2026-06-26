import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/repositories/prisma";
import { requireFarmOperator } from "@/lib/auth/farm-session";
import { ingestCctvEvent, listCameras, listCctvEvents } from "@/services/farm/cctv.service";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ cameras: [], events: [] }, { status: 503 });
  }
  const { error } = await requireFarmOperator();
  if (error) return error;
  const [cameras, events] = await Promise.all([listCameras(), listCctvEvents()]);
  return NextResponse.json({ cameras, events });
}

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const apiKey = process.env.VISION_WEBHOOK_API_KEY || process.env.FARM_WEBHOOK_API_KEY;
  const headerKey = request.headers.get("x-vision-api-key") || request.headers.get("x-webhook-key");

  const body = await request.json();

  if (apiKey && headerKey === apiKey && body.cameraKey) {
    const event = await ingestCctvEvent(body);
    return NextResponse.json({ ok: true, event });
  }

  const { error } = await requireFarmOperator();
  if (error) return error;

  if (body.cameraKey && body.type) {
    const event = await ingestCctvEvent(body);
    return NextResponse.json({ ok: true, event });
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}
