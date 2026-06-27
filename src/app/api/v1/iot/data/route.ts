import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/repositories/prisma";
import { verifyApiKey } from "@/lib/farm/api-keys";
import { prisma } from "@/repositories/prisma";
import { ingestDeviceData } from "@/services/farm/iot.service";
import type { IngestEnvelope } from "@/lib/farm/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const apiKey =
      request.headers.get("x-device-key") ||
      request.headers.get("authorization")?.replace("Bearer ", "");
    const body = (await request.json()) as IngestEnvelope & { deviceKey?: string };
    const deviceKey = body.deviceKey || request.headers.get("x-device-id");

    if (!deviceKey || !apiKey) {
      return NextResponse.json({ error: "deviceKey and API key required" }, { status: 401 });
    }

    const device = await prisma.ioTDevice.findUnique({ where: { deviceKey } });
    if (!device?.apiKeyHash || !verifyApiKey(apiKey, device.apiKeyHash)) {
      return NextResponse.json({ error: "Invalid device credentials" }, { status: 401 });
    }

    const result = await ingestDeviceData(deviceKey, body, "HTTP");
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

export async function GET(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ devices: [] }, { status: 503 });
  }
  const { requireFarmOperator } = await import("@/lib/auth/farm-session");
  const { user, error } = await requireFarmOperator();
  if (error) return error;

  const { resolveTenantFromRequest } = await import("@/lib/tenant/resolve");
  const tenant = await resolveTenantFromRequest(request);
  const farmId = tenant?.farmId ?? "default";

  const { listDevices } = await import("@/services/farm/iot.service");
  const devices = await listDevices(farmId);
  return NextResponse.json({ devices, userId: user!.id, farmId });
}
