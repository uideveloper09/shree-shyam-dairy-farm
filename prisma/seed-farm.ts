import { PrismaClient } from "@prisma/client";
import { hashApiKey, generateApiKey } from "@/lib/farm/api-keys";
import { ensureAutonomyDefaults } from "@/services/farm/autonomy.service";

export async function seedFarm(prisma: PrismaClient) {
  await ensureAutonomyDefaults();

  const deviceKey = "SSD-IOT-001";
  const deviceApiKey = process.env.SEED_DEVICE_API_KEY || generateApiKey("dev");

  await prisma.ioTDevice.upsert({
    where: { deviceKey },
    create: {
      deviceKey,
      name: "Main Shed Sensor Hub",
      type: "SENSOR",
      apiKeyHash: hashApiKey(deviceApiKey),
      status: "OFFLINE",
    },
    update: {},
  });

  const wsKey = "WS-SSD-001";
  const wsApiKey = process.env.SEED_WEATHER_API_KEY || generateApiKey("ws");
  await prisma.weatherStation.upsert({
    where: { stationKey: wsKey },
    create: {
      stationKey: wsKey,
      name: "Main Weather Station",
      apiKeyHash: hashApiKey(wsApiKey),
      latitude: 25.5941,
      longitude: 85.1376,
    },
    update: {},
  });

  await prisma.cctvCamera.upsert({
    where: { cameraKey: "CAM-GATE-01" },
    create: {
      cameraKey: "CAM-GATE-01",
      name: "Main Gate Camera",
      location: "gate",
      streamUrl: "rtsp://localhost:8554/gate",
    },
    update: {},
  });

  await prisma.cow.upsert({
    where: { farmId_tagNumber: { farmId: "default", tagNumber: "TAG-001" } },
    create: { tagNumber: "TAG-001", name: "Gauri", breed: "Sahiwal" },
    update: {},
  });

  await prisma.predictionModel.upsert({
    where: { key: "demand_hw_v1" },
    create: { key: "demand_hw_v1", domain: "DEMAND", version: "1.0.0", config: {} },
    update: {},
  });

  console.log("Farm seed complete.");
  console.log("Device API key (save to .env):", deviceApiKey);
  console.log("Weather API key:", wsApiKey);

  return { deviceApiKey, wsApiKey };
}
