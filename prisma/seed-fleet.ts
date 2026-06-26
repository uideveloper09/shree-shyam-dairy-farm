import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.fleetVehicle.findFirst();
  if (existing) {
    console.log("Fleet data already exists, skipping demo records.");
    return;
  }

  const tanker = await prisma.fleetVehicle.create({
    data: {
      registrationNo: "RJ14-SS-1001",
      name: "Milk Tanker Alpha",
      type: "TANKER",
      isTanker: true,
      tankCapacityLiters: 5000,
      fuelType: "Diesel",
      make: "Tata",
      model: "LPT 1613",
      year: 2022,
      odometerKm: 45200,
      currentTempCelsius: 4.2,
      currentLat: 26.9124,
      currentLng: 75.7873,
      lastGpsAt: new Date(),
    },
  });

  await prisma.fleetVehicle.create({
    data: {
      registrationNo: "RJ14-SS-2002",
      name: "Delivery Van Beta",
      type: "VAN",
      fuelType: "CNG",
      make: "Mahindra",
      model: "Supro",
      year: 2023,
      odometerKm: 12800,
    },
  });

  await prisma.fleetFuelLog.create({
    data: {
      vehicleId: tanker.id,
      liters: 120,
      cost: 10800,
      odometerKm: 45100,
      station: "HP Petrol Pump, Jaipur",
    },
  });

  await prisma.fleetMaintenance.create({
    data: {
      vehicleId: tanker.id,
      type: "SCHEDULED",
      title: "Engine oil change",
      scheduledAt: new Date(Date.now() + 14 * 86400_000),
      odometerKm: 46000,
      vendor: "Tata Service Centre",
    },
  });

  await prisma.fleetInsurance.create({
    data: {
      vehicleId: tanker.id,
      provider: "ICICI Lombard",
      policyNo: "FLT-2025-001",
      premium: 18500,
      coverageAmt: 1500000,
      startDate: new Date("2025-04-01"),
      endDate: new Date("2026-03-31"),
    },
  });

  await prisma.fleetServiceReminder.create({
    data: {
      vehicleId: tanker.id,
      title: "Cooling unit inspection",
      description: "Check milk tank refrigeration unit",
      dueAt: new Date(Date.now() + 7 * 86400_000),
    },
  });

  const stops = [
    { id: "farm", name: "Shree Shyam Farm", lat: 26.9124, lng: 75.7873 },
    { id: "stop1", name: "Malviya Nagar Hub", lat: 26.8546, lng: 75.8242 },
    { id: "stop2", name: "Vaishali Nagar", lat: 26.9034, lng: 75.7351 },
    { id: "stop3", name: "Mansarovar Depot", lat: 26.8651, lng: 75.7702 },
  ];

  await prisma.fleetRoute.create({
    data: {
      name: "Morning Milk Route — Jaipur",
      vehicleId: tanker.id,
      stops,
      optimizedOrder: ["farm", "stop3", "stop1", "stop2"],
      totalDistanceKm: 28.5,
      estimatedMinutes: 49,
      isOptimized: true,
    },
  });

  await prisma.fleetGpsTrack.create({
    data: {
      vehicleId: tanker.id,
      latitude: 26.9124,
      longitude: 75.7873,
      speedKmh: 0,
      source: "seed",
    },
  });

  await prisma.fleetTrip.create({
    data: {
      vehicleId: tanker.id,
      status: "COMPLETED",
      milkLiters: 4200,
      distanceKm: 28.5,
      fuelUsedLiters: 12,
      startedAt: new Date(Date.now() - 86400_000),
      completedAt: new Date(Date.now() - 82800_000),
      notes: "Morning delivery run",
    },
  });

  console.log("Seeded fleet demo data.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
