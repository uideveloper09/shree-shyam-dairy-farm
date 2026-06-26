import { prisma } from "@/repositories/prisma";
import { optimizeRoute } from "@/modules/fleet/routes";
import type { RouteStop } from "@/modules/fleet/types";
import type {
  FleetInsuranceStatus,
  FleetMaintenanceStatus,
  FleetMaintenanceType,
  FleetTripStatus,
  FleetVehicleStatus,
  FleetVehicleType,
} from "@prisma/client";

export async function getFleetDashboard(tenantId?: string | null) {
  const where = { tenantId: tenantId ?? undefined };
  const now = new Date();
  const in30Days = new Date(Date.now() + 30 * 86400_000);

  const [
    vehicleCount,
    activeVehicles,
    tankerCount,
    driverCount,
    openMaintenance,
    expiringInsurance,
    pendingReminders,
    activeTrips,
    fuelThisMonth,
    recentTrips,
  ] = await Promise.all([
    prisma.fleetVehicle.count({ where }),
    prisma.fleetVehicle.count({ where: { ...where, status: "ACTIVE" } }),
    prisma.fleetVehicle.count({ where: { ...where, isTanker: true } }),
    prisma.fleetDriver.count({ where: { ...where, isActive: true } }),
    prisma.fleetMaintenance.count({
      where: { vehicle: where, status: { in: ["SCHEDULED", "IN_PROGRESS"] } },
    }),
    prisma.fleetInsurance.count({
      where: { vehicle: where, status: "ACTIVE", endDate: { lte: in30Days } },
    }),
    prisma.fleetServiceReminder.count({
      where: { vehicle: where, status: { in: ["PENDING", "OVERDUE"] } },
    }),
    prisma.fleetTrip.count({ where: { vehicle: where, status: "IN_PROGRESS" } }),
    prisma.fleetFuelLog.aggregate({
      where: {
        vehicle: where,
        filledAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) },
      },
      _sum: { liters: true, cost: true },
    }),
    prisma.fleetTrip.findMany({
      where: { vehicle: where },
      include: {
        vehicle: { select: { registrationNo: true, name: true } },
        driver: { include: { user: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return {
    stats: {
      vehicles: vehicleCount,
      activeVehicles,
      tankers: tankerCount,
      drivers: driverCount,
      openMaintenance,
      expiringInsurance,
      pendingReminders,
      activeTrips,
      fuelLitersMonth: Number(fuelThisMonth._sum.liters ?? 0),
      fuelCostMonth: Number(fuelThisMonth._sum.cost ?? 0),
    },
    recentTrips,
  };
}

// ─── Vehicles ────────────────────────────────────────────────────────────────

export async function listVehicles(tenantId?: string | null, tankersOnly = false) {
  return prisma.fleetVehicle.findMany({
    where: {
      tenantId: tenantId ?? undefined,
      ...(tankersOnly ? { isTanker: true } : {}),
    },
    include: {
      assignedDriver: { include: { user: { select: { id: true, name: true, phone: true } } } },
      _count: { select: { trips: true, fuelLogs: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function createVehicle(
  tenantId: string | null | undefined,
  data: {
    registrationNo: string;
    name: string;
    type?: FleetVehicleType;
    status?: FleetVehicleStatus;
    make?: string;
    model?: string;
    year?: number;
    fuelType?: string;
    isTanker?: boolean;
    tankCapacityLiters?: number;
    gpsDeviceId?: string;
    notes?: string;
  }
) {
  return prisma.fleetVehicle.create({
    data: {
      tenantId,
      registrationNo: data.registrationNo.toUpperCase(),
      name: data.name,
      type: data.isTanker ? "TANKER" : (data.type ?? "TRUCK"),
      status: data.status ?? "ACTIVE",
      make: data.make,
      model: data.model,
      year: data.year,
      fuelType: data.fuelType,
      isTanker: data.isTanker ?? false,
      tankCapacityLiters: data.tankCapacityLiters,
      gpsDeviceId: data.gpsDeviceId,
      notes: data.notes,
    },
  });
}

export async function updateVehicle(
  id: string,
  data: Partial<{
    name: string;
    status: FleetVehicleStatus;
    odometerKm: number;
    assignedDriverId: string | null;
    currentTempCelsius: number;
    notes: string;
  }>
) {
  return prisma.fleetVehicle.update({ where: { id }, data });
}

// ─── Drivers ─────────────────────────────────────────────────────────────────

export async function listDrivers(tenantId?: string | null) {
  return prisma.fleetDriver.findMany({
    where: { tenantId: tenantId ?? undefined },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, role: true } },
      assignedVehicles: { select: { id: true, registrationNo: true, name: true } },
      _count: { select: { trips: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createDriver(
  tenantId: string | null | undefined,
  data: {
    userId: string;
    licenseNo?: string;
    licenseExpiry?: string;
    phone?: string;
  }
) {
  return prisma.fleetDriver.create({
    data: {
      tenantId,
      userId: data.userId,
      licenseNo: data.licenseNo,
      licenseExpiry: data.licenseExpiry ? new Date(data.licenseExpiry) : undefined,
      phone: data.phone,
    },
    include: { user: { select: { name: true, email: true } } },
  });
}

// ─── Fuel ────────────────────────────────────────────────────────────────────

export async function listFuelLogs(vehicleId?: string) {
  return prisma.fleetFuelLog.findMany({
    where: vehicleId ? { vehicleId } : undefined,
    include: { vehicle: { select: { registrationNo: true, name: true } } },
    orderBy: { filledAt: "desc" },
    take: 100,
  });
}

export async function logFuel(data: {
  vehicleId: string;
  liters: number;
  cost: number;
  odometerKm?: number;
  station?: string;
  notes?: string;
}) {
  const log = await prisma.fleetFuelLog.create({ data });
  if (data.odometerKm !== undefined) {
    await prisma.fleetVehicle.update({
      where: { id: data.vehicleId },
      data: { odometerKm: data.odometerKm },
    });
  }
  return log;
}

// ─── Maintenance ─────────────────────────────────────────────────────────────

export async function listMaintenance(vehicleId?: string) {
  return prisma.fleetMaintenance.findMany({
    where: vehicleId ? { vehicleId } : undefined,
    include: { vehicle: { select: { registrationNo: true, name: true } } },
    orderBy: { scheduledAt: "desc" },
    take: 100,
  });
}

export async function createMaintenance(data: {
  vehicleId: string;
  type?: FleetMaintenanceType;
  title: string;
  description?: string;
  cost?: number;
  scheduledAt?: string;
  odometerKm?: number;
  vendor?: string;
}) {
  return prisma.fleetMaintenance.create({
    data: {
      vehicleId: data.vehicleId,
      type: data.type ?? "SCHEDULED",
      title: data.title,
      description: data.description,
      cost: data.cost,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
      odometerKm: data.odometerKm,
      vendor: data.vendor,
    },
  });
}

export async function completeMaintenance(id: string, cost?: number) {
  return prisma.fleetMaintenance.update({
    where: { id },
    data: { status: "COMPLETED", completedAt: new Date(), ...(cost !== undefined ? { cost } : {}) },
  });
}

// ─── Insurance ───────────────────────────────────────────────────────────────

export async function listInsurance(vehicleId?: string) {
  return prisma.fleetInsurance.findMany({
    where: vehicleId ? { vehicleId } : undefined,
    include: { vehicle: { select: { registrationNo: true, name: true } } },
    orderBy: { endDate: "asc" },
  });
}

export async function createInsurance(data: {
  vehicleId: string;
  provider: string;
  policyNo: string;
  status?: FleetInsuranceStatus;
  premium?: number;
  coverageAmt?: number;
  startDate: string;
  endDate: string;
  documentUrl?: string;
}) {
  return prisma.fleetInsurance.create({
    data: {
      vehicleId: data.vehicleId,
      provider: data.provider,
      policyNo: data.policyNo,
      status: data.status ?? "ACTIVE",
      premium: data.premium,
      coverageAmt: data.coverageAmt,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      documentUrl: data.documentUrl,
    },
  });
}

// ─── GPS ─────────────────────────────────────────────────────────────────────

export async function recordVehicleGps(
  vehicleId: string,
  data: {
    latitude: number;
    longitude: number;
    speedKmh?: number;
    heading?: number;
    accuracy?: number;
    source?: string;
  }
) {
  const [track] = await prisma.$transaction([
    prisma.fleetGpsTrack.create({
      data: {
        vehicleId,
        latitude: data.latitude,
        longitude: data.longitude,
        speedKmh: data.speedKmh,
        heading: data.heading,
        accuracy: data.accuracy,
        source: data.source ?? "device",
      },
    }),
    prisma.fleetVehicle.update({
      where: { id: vehicleId },
      data: {
        currentLat: data.latitude,
        currentLng: data.longitude,
        lastGpsAt: new Date(),
      },
    }),
  ]);
  return track;
}

export async function getVehicleGpsHistory(vehicleId: string, limit = 50) {
  return prisma.fleetGpsTrack.findMany({
    where: { vehicleId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getFleetGpsSnapshot(tenantId?: string | null) {
  return prisma.fleetVehicle.findMany({
    where: {
      tenantId: tenantId ?? undefined,
      currentLat: { not: null },
    },
    select: {
      id: true,
      registrationNo: true,
      name: true,
      isTanker: true,
      currentLat: true,
      currentLng: true,
      lastGpsAt: true,
      currentTempCelsius: true,
      assignedDriver: {
        include: { user: { select: { name: true } } },
      },
    },
  });
}

// ─── Service Reminders ───────────────────────────────────────────────────────

export async function listReminders(vehicleId?: string, includeOverdue = true) {
  const statuses = includeOverdue ? (["PENDING", "OVERDUE"] as const) : (["PENDING"] as const);
  return prisma.fleetServiceReminder.findMany({
    where: {
      ...(vehicleId ? { vehicleId } : {}),
      status: { in: [...statuses] },
    },
    include: { vehicle: { select: { registrationNo: true, name: true } } },
    orderBy: { dueAt: "asc" },
  });
}

export async function createReminder(data: {
  vehicleId: string;
  title: string;
  description?: string;
  dueAt: string;
  dueOdometer?: number;
}) {
  return prisma.fleetServiceReminder.create({
    data: {
      vehicleId: data.vehicleId,
      title: data.title,
      description: data.description,
      dueAt: new Date(data.dueAt),
      dueOdometer: data.dueOdometer,
    },
  });
}

export async function completeReminder(id: string) {
  return prisma.fleetServiceReminder.update({
    where: { id },
    data: { status: "COMPLETED", completedAt: new Date() },
  });
}

export async function markOverdueReminders() {
  const result = await prisma.fleetServiceReminder.updateMany({
    where: { status: "PENDING", dueAt: { lt: new Date() } },
    data: { status: "OVERDUE" },
  });
  return { updated: result.count };
}

// ─── Route Optimization ──────────────────────────────────────────────────────

export async function createRoute(
  tenantId: string | null | undefined,
  data: {
    name: string;
    vehicleId?: string;
    stops: RouteStop[];
    optimize?: boolean;
    origin?: { lat: number; lng: number };
  }
) {
  let optimizedOrder: string[] | undefined;
  let totalDistanceKm: number | undefined;
  let estimatedMinutes: number | undefined;
  let isOptimized = false;

  if (data.optimize !== false && data.stops.length > 1) {
    const result = optimizeRoute(data.stops, data.origin);
    optimizedOrder = result.order;
    totalDistanceKm = result.totalDistanceKm;
    estimatedMinutes = result.estimatedMinutes;
    isOptimized = true;
  }

  return prisma.fleetRoute.create({
    data: {
      tenantId,
      vehicleId: data.vehicleId,
      name: data.name,
      stops: data.stops as object,
      optimizedOrder: optimizedOrder as object,
      totalDistanceKm,
      estimatedMinutes,
      isOptimized,
    },
  });
}

export async function listRoutes(tenantId?: string | null) {
  return prisma.fleetRoute.findMany({
    where: { tenantId: tenantId ?? undefined },
    include: { vehicle: { select: { registrationNo: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export { optimizeRoute };

// ─── Trip History ────────────────────────────────────────────────────────────

export async function listTrips(vehicleId?: string, driverId?: string) {
  return prisma.fleetTrip.findMany({
    where: {
      ...(vehicleId ? { vehicleId } : {}),
      ...(driverId ? { driverId } : {}),
    },
    include: {
      vehicle: { select: { registrationNo: true, name: true, isTanker: true } },
      driver: { include: { user: { select: { name: true } } } },
      route: { select: { name: true, totalDistanceKm: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function createTrip(data: {
  vehicleId: string;
  driverId?: string;
  driverUserId?: string;
  routeId?: string;
  milkLiters?: number;
  notes?: string;
}) {
  return prisma.fleetTrip.create({
    data: {
      vehicleId: data.vehicleId,
      driverId: data.driverId,
      driverUserId: data.driverUserId,
      routeId: data.routeId,
      milkLiters: data.milkLiters,
      notes: data.notes,
      status: "PLANNED",
    },
  });
}

export async function updateTripStatus(
  id: string,
  status: FleetTripStatus,
  data?: {
    startOdometer?: number;
    endOdometer?: number;
    distanceKm?: number;
    fuelUsedLiters?: number;
  }
) {
  const extra: Record<string, unknown> = { status, ...data };
  if (status === "IN_PROGRESS") extra.startedAt = new Date();
  if (status === "COMPLETED") extra.completedAt = new Date();
  return prisma.fleetTrip.update({ where: { id }, data: extra });
}
