import { prisma } from "@/repositories/prisma";

export async function getDeliveryAssignments(assigneeId: string) {
  return prisma.deliveryAssignment.findMany({
    where: {
      assigneeId,
      status: { notIn: ["delivered", "failed"] },
    },
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          total: true,
          status: true,
          deliverySlot: true,
          deliveryDate: true,
          guestPhone: true,
          shippingAddress: {
            select: {
              line1: true,
              line2: true,
              city: true,
              state: true,
              pincode: true,
              phone: true,
            },
          },
          user: { select: { name: true, phone: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function updateDeliveryAssignment(
  id: string,
  assigneeId: string,
  data: {
    status?: string;
    latitude?: number;
    longitude?: number;
    proofPhotoUrl?: string;
    notes?: string;
    scannedAt?: Date;
  }
) {
  const assignment = await prisma.deliveryAssignment.findFirst({
    where: { id, assigneeId },
    include: { order: true },
  });
  if (!assignment) return null;

  const updated = await prisma.deliveryAssignment.update({
    where: { id },
    data: {
      ...data,
      deliveredAt: data.status === "delivered" ? new Date() : undefined,
    },
  });

  if (data.status === "delivered") {
    await prisma.order.update({
      where: { id: assignment.orderId },
      data: { status: "DELIVERED", deliveredAt: new Date() },
    });
  } else if (data.status === "in_transit") {
    await prisma.order.update({
      where: { id: assignment.orderId },
      data: { status: "OUT_FOR_DELIVERY" },
    });
  }

  return updated;
}

export async function assignOrderToDelivery(orderId: string, assigneeId: string) {
  return prisma.deliveryAssignment.upsert({
    where: { orderId },
    create: { orderId, assigneeId, status: "assigned" },
    update: { assigneeId, status: "assigned" },
  });
}

export async function getTodayDeliveryStats(assigneeId: string) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const [pending, delivered, total] = await Promise.all([
    prisma.deliveryAssignment.count({
      where: { assigneeId, status: { notIn: ["delivered", "failed"] } },
    }),
    prisma.deliveryAssignment.count({
      where: { assigneeId, status: "delivered", deliveredAt: { gte: start } },
    }),
    prisma.deliveryAssignment.count({ where: { assigneeId, createdAt: { gte: start } } }),
  ]);

  return { pending, delivered, total };
}
