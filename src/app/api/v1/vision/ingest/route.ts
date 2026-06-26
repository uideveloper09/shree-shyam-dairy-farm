import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/repositories/prisma";
import { requireFarmOperator } from "@/lib/auth/farm-session";
import { ingestVisionDetection, listVisionDetections } from "@/services/farm/vision.service";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ detections: [] }, { status: 503 });
  }
  const { error } = await requireFarmOperator();
  if (error) return error;
  const detections = await listVisionDetections();
  return NextResponse.json({ detections });
}

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const apiKey = process.env.VISION_WEBHOOK_API_KEY || process.env.FARM_WEBHOOK_API_KEY;
  const headerKey = request.headers.get("x-vision-api-key");

  const body = await request.json();

  if (apiKey && headerKey === apiKey) {
    const detection = await ingestVisionDetection(body);
    return NextResponse.json({ ok: true, detection });
  }

  const { error } = await requireFarmOperator();
  if (error) return error;

  const detection = await ingestVisionDetection(body);
  return NextResponse.json({ ok: true, detection });
}
