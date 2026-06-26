import { NextResponse } from "next/server";
import { isDatabaseConfigured, prisma } from "@/repositories/prisma";
import { requireFarmOperator } from "@/lib/auth/farm-session";
import {
  getAutonomyConfig,
  listActuators,
  manualActuatorCommand,
  updateAutonomyConfig,
} from "@/services/farm/autonomy.service";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({}, { status: 503 });
  }
  const { error } = await requireFarmOperator();
  if (error) return error;

  const [config, actuators, tanks, emergencies, rules] = await Promise.all([
    getAutonomyConfig(),
    listActuators(),
    prisma.milkTankMonitor.findMany(),
    prisma.emergencyEvent.findMany({
      where: { acknowledgedAt: null },
      take: 10,
      orderBy: { createdAt: "desc" },
    }),
    prisma.automationRule.findMany({ where: { status: "ACTIVE" } }),
  ]);

  return NextResponse.json({ config, actuators, tanks, emergencies, rules });
}

export async function PATCH(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }
  const { error } = await requireFarmOperator();
  if (error) return error;

  const body = await request.json();
  const config = await updateAutonomyConfig(body);
  return NextResponse.json({ config });
}

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }
  const { error } = await requireFarmOperator();
  if (error) return error;

  const body = await request.json();
  if (body.deviceKey && body.command) {
    const actuator = await manualActuatorCommand(body.deviceKey, body.command);
    return NextResponse.json({ actuator });
  }

  if (body.emergencyId) {
    await prisma.emergencyEvent.update({
      where: { id: body.emergencyId },
      data: { acknowledgedAt: new Date(), acknowledgedBy: body.userId || "admin" },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}
