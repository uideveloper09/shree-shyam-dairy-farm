import { prisma } from "@/repositories/prisma";
import type { IngestEnvelope, NormalizedReading } from "@/lib/farm/types";
import { evaluateAutonomyOnReading } from "@/services/farm/autonomy.service";

export async function ingestDeviceData(
  deviceKey: string,
  envelope: IngestEnvelope,
  source = "HTTP"
) {
  const device = await prisma.ioTDevice.findUnique({ where: { deviceKey } });
  if (!device) throw new Error("Device not found");

  const readings: NormalizedReading[] = [];
  for (const r of envelope.readings) {
    const recordedAt = new Date(r.recordedAt);
    try {
      await prisma.sensorReading.create({
        data: {
          deviceId: device.id,
          sensorKey: r.sensorKey,
          sensorType: r.type,
          value: r.value,
          unit: r.unit,
          recordedAt,
          idempotencyKey: r.idempotencyKey,
          source,
        },
      });
      readings.push({
        sensorKey: r.sensorKey,
        sensorType: r.type,
        value: r.value,
        unit: r.unit,
        recordedAt,
        idempotencyKey: r.idempotencyKey,
      });
    } catch (e: unknown) {
      const err = e as { code?: string };
      if (err.code !== "P2002") throw e;
    }
  }

  await prisma.ioTDevice.update({
    where: { id: device.id },
    data: { status: "ONLINE", lastSeenAt: new Date() },
  });

  for (const reading of readings) {
    evaluateAutonomyOnReading(reading).catch(() => {});
  }

  return { deviceKey, count: readings.length };
}

export async function listDevices(farmId = "default") {
  return prisma.ioTDevice.findMany({
    where: { farmId },
    orderBy: { name: "asc" },
    include: {
      readings: { take: 5, orderBy: { recordedAt: "desc" } },
    },
  });
}

export async function getLatestReadings(deviceKey: string, limit = 50) {
  const device = await prisma.ioTDevice.findUnique({ where: { deviceKey } });
  if (!device) return [];
  return prisma.sensorReading.findMany({
    where: { deviceId: device.id },
    orderBy: { recordedAt: "desc" },
    take: limit,
  });
}
