import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/repositories/prisma";
import { requireFarmOperator } from "@/lib/auth/farm-session";
import {
  authenticateGateway,
  gatewayIngest,
  getGatewayConfig,
  listGateways,
  provisionGateway,
  recordHeartbeat,
} from "@/services/farm/gateway.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ gateways: [] }, { status: 503 });
  }

  const url = new URL(request.url);
  const configKey = url.searchParams.get("gatewayKey");
  const apiKey =
    request.headers.get("x-gateway-key") ||
    request.headers.get("authorization")?.replace("Bearer ", "");

  if (configKey && apiKey) {
    const gw = await authenticateGateway(configKey, apiKey);
    if (!gw) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const config = await getGatewayConfig(configKey);
    return NextResponse.json(config);
  }

  const { error } = await requireFarmOperator();
  if (error) return error;
  const gateways = await listGateways();
  return NextResponse.json({ gateways });
}

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const body = await request.json();
  const gatewayKey = body.gatewayKey || request.headers.get("x-gateway-id");
  const apiKey =
    request.headers.get("x-gateway-key") ||
    request.headers.get("authorization")?.replace("Bearer ", "");

  if (body.type === "heartbeat" && gatewayKey && apiKey) {
    const gw = await authenticateGateway(gatewayKey, apiKey);
    if (!gw) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const updated = await recordHeartbeat(gatewayKey, body);
    return NextResponse.json({ ok: true, gateway: updated });
  }

  if (body.messages && gatewayKey && apiKey) {
    const gw = await authenticateGateway(gatewayKey, apiKey);
    if (!gw) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const results = await gatewayIngest(gatewayKey, body.messages);
    return NextResponse.json({ ok: true, results });
  }

  const { error } = await requireFarmOperator();
  if (error) return error;

  if (body.action === "provision") {
    const result = await provisionGateway(body.name || "Farm Gateway", body.platform);
    return NextResponse.json({
      gateway: result.gateway,
      apiKey: result.apiKeyPlain,
      message: "Save API key — shown once",
    });
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}
