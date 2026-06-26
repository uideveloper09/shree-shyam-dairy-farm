import { prisma } from "@/repositories/prisma";
import { generateApiKey, hashApiKey, verifyApiKey } from "@/lib/farm/api-keys";

export async function ingestWeatherReadings(
  stationKey: string,
  readings: Array<{
    sensorType: string;
    value: number;
    unit?: string;
    recordedAt: string;
    idempotencyKey?: string;
  }>
) {
  const station = await prisma.weatherStation.findUnique({ where: { stationKey } });
  if (!station) throw new Error("Station not found");

  let count = 0;
  for (const r of readings) {
    try {
      await prisma.weatherReading.create({
        data: {
          stationId: station.id,
          sensorType: r.sensorType,
          value: r.value,
          unit: r.unit,
          recordedAt: new Date(r.recordedAt),
          idempotencyKey: r.idempotencyKey,
        },
      });
      count++;
    } catch (e: unknown) {
      const err = e as { code?: string };
      if (err.code !== "P2002") throw e;
    }
  }

  await prisma.weatherStation.update({
    where: { id: station.id },
    data: { status: "ONLINE", lastSeenAt: new Date() },
  });

  return { stationKey, count };
}

export async function getCurrentWeather(stationKey?: string) {
  const station = stationKey
    ? await prisma.weatherStation.findUnique({ where: { stationKey } })
    : await prisma.weatherStation.findFirst();

  if (!station) return null;

  const readings = await prisma.weatherReading.findMany({
    where: { stationId: station.id },
    orderBy: { recordedAt: "desc" },
    take: 20,
  });

  const latest: Record<string, number> = {};
  for (const r of readings) {
    if (!(r.sensorType in latest)) latest[r.sensorType] = r.value;
  }

  const temp = latest.TEMPERATURE ?? latest.temp_c;
  const humidity = latest.HUMIDITY ?? latest.humidity_pct;
  let thi: number | null = null;
  let heatStress = "NORMAL";
  if (temp != null && humidity != null) {
    thi = 1.8 * temp + 32 - (0.55 - 0.0055 * humidity) * (1.8 * temp - 26);
    if (thi >= 80) heatStress = "EXTREME";
    else if (thi >= 76) heatStress = "SEVERE";
    else if (thi >= 71) heatStress = "MODERATE";
    else if (thi >= 68) heatStress = "MILD";
  }

  return { station, latest, thi, heatStress };
}

export async function authenticateWeatherStation(stationKey: string, apiKey: string) {
  const station = await prisma.weatherStation.findUnique({ where: { stationKey } });
  if (!station || !verifyApiKey(apiKey, station.apiKeyHash)) return null;
  return station;
}

export async function provisionWeatherStation(name: string) {
  const stationKey = `WS-SSD-${Date.now().toString(36).toUpperCase()}`;
  const apiKey = generateApiKey("ws");
  const station = await prisma.weatherStation.create({
    data: {
      stationKey,
      name,
      apiKeyHash: hashApiKey(apiKey),
    },
  });
  return { station, apiKeyPlain: apiKey };
}
