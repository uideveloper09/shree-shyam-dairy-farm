import { prisma } from "@/repositories/prisma";
import { DEFAULT_PIPELINE_STAGES } from "@/modules/crm/types";

export async function ensureDefaultPipeline(tenantId?: string | null) {
  const existing = await prisma.crmPipeline.findFirst({
    where: { tenantId: tenantId ?? null, isDefault: true },
    include: { stages: { orderBy: { order: "asc" } } },
  });
  if (existing) return existing;

  return prisma.crmPipeline.create({
    data: {
      tenantId,
      name: "Sales Pipeline",
      slug: "sales",
      isDefault: true,
      stages: {
        create: DEFAULT_PIPELINE_STAGES.map((s) => ({
          name: s.name,
          order: s.order,
          probability: s.probability,
        })),
      },
    },
    include: { stages: { orderBy: { order: "asc" } } },
  });
}

export async function getPipelineBoard(tenantId?: string | null) {
  const pipeline = await ensureDefaultPipeline(tenantId);
  const opportunities = await prisma.crmOpportunity.findMany({
    where: { tenantId: tenantId ?? undefined },
    include: {
      customer: { select: { id: true, name: true } },
      owner: { select: { id: true, name: true, email: true } },
      pipelineStage: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  const byStage = pipeline.stages.map((stage) => ({
    stage,
    opportunities: opportunities.filter((o) => o.stageId === stage.id),
  }));

  const unassigned = opportunities.filter((o) => !o.stageId);

  return { pipeline, byStage, unassigned };
}
