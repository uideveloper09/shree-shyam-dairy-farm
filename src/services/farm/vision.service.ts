import { prisma } from "@/repositories/prisma";

export async function ingestVisionDetection(data: {
  cameraKey?: string;
  pipeline: string;
  class: string;
  confidence: number;
  payload?: Record<string, unknown>;
  detectedAt: string;
}) {
  return prisma.visionDetection.create({
    data: {
      cameraKey: data.cameraKey,
      pipeline: data.pipeline,
      class: data.class,
      confidence: data.confidence,
      payload: data.payload as object | undefined,
      detectedAt: new Date(data.detectedAt),
    },
  });
}

export async function listVisionDetections(limit = 50) {
  return prisma.visionDetection.findMany({
    take: limit,
    orderBy: { detectedAt: "desc" },
  });
}
