import { prisma } from "@/repositories/prisma";

export async function getOwnerDashboard() {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    ordersToday,
    revenue7d,
    activeSubscriptions,
    pendingDeliveries,
    farmDevices,
    emergencyEvents,
    recentOrders,
  ] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: since24h } } }),
    prisma.order.aggregate({
      where: { createdAt: { gte: since7d }, paymentStatus: "CAPTURED" },
      _sum: { total: true },
    }),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
    prisma.deliveryAssignment.count({
      where: { status: { notIn: ["delivered", "failed"] } },
    }),
    prisma.ioTDevice.count({ where: { status: { not: "OFFLINE" } } }),
    prisma.emergencyEvent.count({
      where: { createdAt: { gte: since24h }, acknowledgedAt: null },
    }),
    prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        orderNumber: true,
        total: true,
        status: true,
        createdAt: true,
        user: { select: { name: true } },
      },
    }),
  ]);

  return {
    kpis: {
      ordersToday,
      revenue7d: Number(revenue7d._sum.total ?? 0),
      activeSubscriptions,
      pendingDeliveries,
      farmDevices,
      emergencyEvents,
    },
    recentOrders,
  };
}

export async function getCustomerMobileData(userId: string) {
  const [orders, subscriptions, notifications] = await Promise.all([
    prisma.order.findMany({
      where: { userId },
      take: 10,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        deliveryDate: true,
        deliverySlot: true,
        createdAt: true,
      },
    }),
    prisma.subscription.findMany({
      where: { userId, status: { in: ["ACTIVE", "PAUSED", "VACATION"] } },
      select: {
        id: true,
        status: true,
        frequency: true,
        quantity: true,
        nextDelivery: true,
        product: { select: { name: true } },
      },
    }),
    prisma.notification.findMany({
      where: { userId },
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, body: true, readAt: true, createdAt: true },
    }),
  ]);

  return { orders, subscriptions, notifications };
}

export async function getFarmManagerMobileData() {
  const [devices, weather, emergencies, milkTanks] = await Promise.all([
    prisma.ioTDevice.count({ where: { status: { not: "OFFLINE" } } }),
    prisma.weatherStation.findFirst({
      orderBy: { updatedAt: "desc" },
      select: { name: true, lastSeenAt: true },
    }),
    prisma.emergencyEvent.findMany({
      where: { acknowledgedAt: null },
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        source: true,
        severity: true,
        title: true,
        message: true,
        createdAt: true,
      },
    }),
    prisma.milkTankMonitor.findMany({
      take: 5,
      select: { id: true, name: true, levelPercent: true, tempC: true, lastReadingAt: true },
    }),
  ]);

  return { devices, weather, emergencies, milkTanks };
}

export async function getVetMobileData() {
  const [cows, emergencies] = await Promise.all([
    prisma.cow.findMany({
      take: 20,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        tagNumber: true,
        name: true,
        breed: true,
        status: true,
        updatedAt: true,
      },
    }),
    prisma.emergencyEvent.findMany({
      where: { source: { contains: "health" }, acknowledgedAt: null },
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return { cows, emergencies };
}
