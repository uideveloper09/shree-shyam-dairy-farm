import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/repositories/prisma";
import { requireFarmOperator } from "@/lib/auth/farm-session";
import { getMqttHealth } from "@/services/farm/mqtt.service";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ connected: false }, { status: 503 });
  }
  const { error } = await requireFarmOperator();
  if (error) return error;
  const health = await getMqttHealth();
  return NextResponse.json(health);
}
