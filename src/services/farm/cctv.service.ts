import { prisma } from "@/repositories/prisma";

export async function listCameras() {
  return prisma.cctvCamera.findMany({ orderBy: { name: "asc" } });
}

export async function ingestCctvEvent(data: {
  cameraKey: string;
  type: string;
  severity?: string;
  confidence?: number;
  payload?: Record<string, unknown>;
  occurredAt: string;
}) {
  const camera = await prisma.cctvCamera.findUnique({
    where: { cameraKey: data.cameraKey },
  });
  if (!camera) throw new Error("Camera not found");

  const event = await prisma.cctvEvent.create({
    data: {
      cameraId: camera.id,
      type: data.type,
      severity: data.severity || "INFO",
      confidence: data.confidence,
      payload: data.payload as object | undefined,
      occurredAt: new Date(data.occurredAt),
    },
  });

  await prisma.cctvCamera.update({
    where: { id: camera.id },
    data: { status: "ONLINE", lastSeenAt: new Date() },
  });

  if (data.type === "INTRUDER" && data.severity === "CRITICAL") {
    await prisma.emergencyEvent.create({
      data: {
        severity: "CRITICAL",
        source: "cctv",
        title: "Intruder detected",
        message: `Camera ${data.cameraKey} detected intruder`,
        payload: data.payload as object | undefined,
        sirenTriggered: true,
      },
    });
  }

  return event;
}

export async function listCctvEvents(limit = 50) {
  return prisma.cctvEvent.findMany({
    take: limit,
    orderBy: { occurredAt: "desc" },
    include: { camera: { select: { cameraKey: true, name: true } } },
  });
}
