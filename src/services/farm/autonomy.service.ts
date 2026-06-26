import { prisma } from "@/repositories/prisma";
import type { FarmAutonomyMode } from "@prisma/client";
import type { NormalizedReading } from "@/lib/farm/types";

type Condition = {
  op: string;
  sensorKey?: string;
  value?: number;
  conditions?: Condition[];
};

function matchCondition(c: Condition, reading: NormalizedReading): boolean {
  if (c.op === "and" && c.conditions) {
    return c.conditions.every((x) => matchCondition(x, reading));
  }
  if (c.op === "or" && c.conditions) {
    return c.conditions.some((x) => matchCondition(x, reading));
  }
  if (!c.sensorKey || c.sensorKey !== reading.sensorKey) return false;
  const v = reading.value;
  const t = c.value ?? 0;
  switch (c.op) {
    case "lt":
      return v < t;
    case "gt":
      return v > t;
    case "lte":
      return v <= t;
    case "gte":
      return v >= t;
    case "eq":
      return v === t;
    default:
      return false;
  }
}

const DEFAULT_RULES = [
  {
    name: "Auto Water Pump — Low Level",
    templateKey: "water_pump_low",
    priority: 10,
    conditions: { op: "lt", sensorKey: "tank_level", value: 20 },
    actions: [{ type: "ACTUATOR_ON", deviceKey: "SSD-PUMP-WATER-01" }],
    sensorKeys: ["tank_level"],
    actuatorKeys: ["SSD-PUMP-WATER-01"],
  },
  {
    name: "Auto Water Pump — High Level",
    templateKey: "water_pump_high",
    priority: 10,
    conditions: { op: "gt", sensorKey: "tank_level", value: 85 },
    actions: [{ type: "ACTUATOR_OFF", deviceKey: "SSD-PUMP-WATER-01" }],
    sensorKeys: ["tank_level"],
    actuatorKeys: ["SSD-PUMP-WATER-01"],
  },
  {
    name: "Auto Fan — Heat",
    templateKey: "auto_fan",
    priority: 20,
    conditions: { op: "gt", sensorKey: "shed_temp", value: 32 },
    actions: [{ type: "ACTUATOR_ON", deviceKey: "SSD-FAN-01" }],
    sensorKeys: ["shed_temp"],
    actuatorKeys: ["SSD-FAN-01"],
  },
  {
    name: "Milk Tank — Critical Temp",
    templateKey: "milk_chiller_critical",
    priority: 5,
    conditions: { op: "gt", sensorKey: "milk_temp", value: 8 },
    actions: [
      { type: "ACTUATOR_ON", deviceKey: "SSD-CHILLER-01" },
      { type: "TRIGGER_EMERGENCY", severity: "CRITICAL", title: "Milk temperature critical" },
    ],
    sensorKeys: ["milk_temp"],
    actuatorKeys: ["SSD-CHILLER-01"],
    requiresAck: false,
  },
];

export async function ensureAutonomyDefaults() {
  const config = await prisma.farmAutonomyConfig.findUnique({
    where: { farmId: "default" },
  });
  if (!config) {
    await prisma.farmAutonomyConfig.create({ data: { farmId: "default" } });
  }

  const count = await prisma.automationRule.count();
  if (count === 0) {
    for (const rule of DEFAULT_RULES) {
      await prisma.automationRule.create({
        data: {
          name: rule.name,
          templateKey: rule.templateKey,
          priority: rule.priority,
          conditions: rule.conditions,
          actions: rule.actions,
          sensorKeys: rule.sensorKeys,
          actuatorKeys: rule.actuatorKeys,
          requiresAck: (rule as { requiresAck?: boolean }).requiresAck ?? false,
        },
      });
    }
  }

  const actuators = [
    { deviceKey: "SSD-PUMP-WATER-01", name: "Water Pump", type: "WATER_PUMP" },
    { deviceKey: "SSD-FAN-01", name: "Shed Fans", type: "FAN" },
    { deviceKey: "SSD-FOGGER-01", name: "Fogger", type: "FOGGER" },
    { deviceKey: "SSD-FEED-01", name: "Feed Machine", type: "FEED_MACHINE" },
    { deviceKey: "SSD-CHILLER-01", name: "Milk Chiller", type: "MILK_CHILLER" },
    { deviceKey: "SSD-GEN-01", name: "Generator", type: "GENERATOR" },
  ];
  for (const a of actuators) {
    await prisma.actuatorDevice.upsert({
      where: { deviceKey: a.deviceKey },
      create: a,
      update: {},
    });
  }

  await prisma.milkTankMonitor.upsert({
    where: { tankKey: "TANK-MAIN-01" },
    create: {
      tankKey: "TANK-MAIN-01",
      name: "Main Milk Tank",
      alertThreshold: { levelLow: 20, levelHigh: 95, tempMax: 4 },
    },
    update: {},
  });
}

export async function getAutonomyConfig() {
  await ensureAutonomyDefaults();
  return prisma.farmAutonomyConfig.findUniqueOrThrow({ where: { farmId: "default" } });
}

export async function updateAutonomyConfig(data: {
  mode?: FarmAutonomyMode;
  dryRun?: boolean;
  maintenanceMode?: boolean;
  emergencyStop?: boolean;
}) {
  return prisma.farmAutonomyConfig.update({
    where: { farmId: "default" },
    data,
  });
}

const cooldownCache = new Map<string, number>();

export async function evaluateAutonomyOnReading(reading: NormalizedReading) {
  const config = await getAutonomyConfig();
  if (config.emergencyStop) return;

  const rules = await prisma.automationRule.findMany({
    where: { status: "ACTIVE", sensorKeys: { has: reading.sensorKey } },
    orderBy: { priority: "asc" },
  });

  for (const rule of rules) {
    const conditions = rule.conditions as Condition;
    if (!matchCondition(conditions, reading)) continue;

    const cdKey = rule.id;
    const last = cooldownCache.get(cdKey) ?? 0;
    if (Date.now() - last < rule.cooldownSec * 1000) {
      await prisma.automationLog.create({
        data: {
          ruleId: rule.id,
          result: "SKIPPED_COOLDOWN",
          trigger: reading as object,
          actions: rule.actions as object,
        },
      });
      continue;
    }

    if (config.mode === "MANUAL") {
      await prisma.automationLog.create({
        data: {
          ruleId: rule.id,
          result: "SKIPPED_MODE",
          trigger: reading as object,
          actions: rule.actions as object,
        },
      });
      continue;
    }

    if (config.maintenanceMode && rule.actuatorKeys.some((k) => k.includes("GEN"))) {
      continue;
    }

    if (config.dryRun) {
      await prisma.automationLog.create({
        data: {
          ruleId: rule.id,
          result: "SKIPPED_DRY_RUN",
          trigger: reading as object,
          actions: rule.actions as object,
        },
      });
      continue;
    }

    const actions = rule.actions as Array<Record<string, unknown>>;
    for (const action of actions) {
      if (action.type === "ACTUATOR_ON" || action.type === "ACTUATOR_OFF") {
        const deviceKey = action.deviceKey as string;
        const state = action.type === "ACTUATOR_ON" ? "ON" : "OFF";
        await prisma.actuatorDevice.updateMany({
          where: { deviceKey },
          data: { state, lastCommandAt: new Date() },
        });
      }
      if (action.type === "TRIGGER_EMERGENCY") {
        await prisma.emergencyEvent.create({
          data: {
            severity: (action.severity as string) || "CRITICAL",
            source: rule.templateKey,
            title: (action.title as string) || rule.name,
            message: `Rule triggered: ${rule.name} — ${reading.sensorKey}=${reading.value}`,
            payload: { reading, ruleId: rule.id },
            sirenTriggered: true,
          },
        });
      }
    }

    cooldownCache.set(cdKey, Date.now());
    await prisma.automationLog.create({
      data: {
        ruleId: rule.id,
        result: "EXECUTED",
        trigger: reading as object,
        actions: rule.actions as object,
      },
    });
  }

  if (reading.sensorKey === "tank_level" || reading.sensorKey === "milk_temp") {
    await prisma.milkTankMonitor.updateMany({
      where: { tankKey: "TANK-MAIN-01" },
      data: {
        ...(reading.sensorKey === "tank_level" ? { levelPercent: reading.value } : {}),
        ...(reading.sensorKey === "milk_temp" ? { tempC: reading.value } : {}),
        lastReadingAt: reading.recordedAt,
      },
    });
  }
}

export async function listActuators() {
  return prisma.actuatorDevice.findMany({ orderBy: { name: "asc" } });
}

export async function manualActuatorCommand(deviceKey: string, command: "ON" | "OFF") {
  await prisma.actuatorDevice.updateMany({
    where: { deviceKey },
    data: { state: command, lastCommandAt: new Date() },
  });
  return prisma.actuatorDevice.findUnique({ where: { deviceKey } });
}
