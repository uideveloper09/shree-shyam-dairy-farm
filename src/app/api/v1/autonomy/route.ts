import { NextResponse } from "next/server";
import { isDatabaseConfigured, prisma } from "@/repositories/prisma";
import { requireFarmOperator } from "@/lib/auth/farm-session";
import { resolveTenantFromRequest } from "@/lib/tenant/resolve";
import { withTenantScope } from "@/lib/tenant/isolation";
import { DEFAULT_TENANT_SLUG } from "@/constants/tenant";
import {
  getAutonomyConfig,
  listActuators,
  manualActuatorCommand,
  updateAutonomyConfig,
} from "@/services/farm/autonomy.service";

export const dynamic = "force-dynamic";

async function resolveFarmContext(request: Request) {
  const tenant = await resolveTenantFromRequest(request);
  const resolved =
    tenant ??
    ({
      id: "default",
      slug: DEFAULT_TENANT_SLUG,
      name: "Shree Shyam Dairy Farm",
      plan: "enterprise",
      farmId: DEFAULT_TENANT_SLUG,
    } as const);
  return { tenant: resolved, farmId: resolved.farmId, scope: withTenantScope(resolved) };
}

export async function GET(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({}, { status: 503 });
  }
  const { error } = await requireFarmOperator();
  if (error) return error;

  const { farmId, scope } = await resolveFarmContext(request);

  const [config, actuators, tanks, emergencies, rules] = await Promise.all([
    getAutonomyConfig(farmId),
    listActuators(farmId),
    prisma.milkTankMonitor.findMany({ where: scope }),
    prisma.emergencyEvent.findMany({
      where: { ...scope, acknowledgedAt: null },
      take: 10,
      orderBy: { createdAt: "desc" },
    }),
    prisma.automationRule.findMany({ where: { ...scope, status: "ACTIVE" } }),
  ]);

  return NextResponse.json({ config, actuators, tanks, emergencies, rules, farmId });
}

export async function PATCH(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }
  const { error } = await requireFarmOperator();
  if (error) return error;

  const { farmId } = await resolveFarmContext(request);
  const body = await request.json();
  const config = await updateAutonomyConfig(body, farmId);
  return NextResponse.json({ config });
}

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }
  const { error } = await requireFarmOperator();
  if (error) return error;

  const { farmId, scope } = await resolveFarmContext(request);

  const body = await request.json();
  if (body.deviceKey && body.command) {
    const actuator = await manualActuatorCommand(body.deviceKey, body.command, farmId);
    return NextResponse.json({ actuator });
  }

  if (body.emergencyId) {
    await prisma.emergencyEvent.updateMany({
      where: { id: body.emergencyId, ...scope },
      data: { acknowledgedAt: new Date(), acknowledgedBy: body.userId || "admin" },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}
