import { prisma } from "@/repositories/prisma";
import { batchNumber, buildQrPayload, generateBarcode } from "@/modules/processing/labels";
import { DEFAULT_QC_CHECKS, type RecipeIngredientInput } from "@/modules/processing/types";
import type {
  ProcBatchStatus,
  ProcPackagingType,
  ProcProductType,
  ProcQcStatus,
  ProcScheduleStatus,
} from "@prisma/client";

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export async function getProcessingDashboard(tenantId?: string | null) {
  const where = { tenantId: tenantId ?? undefined };
  const in7Days = addDays(new Date(), 7);

  const [
    activeBatches,
    qcPending,
    expiringSoon,
    todaySchedules,
    byProduct,
    recentBatches,
    failedQc,
  ] = await Promise.all([
    prisma.procBatch.count({
      where: { ...where, status: { in: ["IN_PROGRESS", "QC_PENDING", "APPROVED"] } },
    }),
    prisma.procBatch.count({ where: { ...where, status: "QC_PENDING" } }),
    prisma.procBatch.count({
      where: { ...where, expiryDate: { lte: in7Days, gte: new Date() } },
    }),
    prisma.procSchedule.count({
      where: {
        ...where,
        scheduledDate: new Date(new Date().toISOString().slice(0, 10)),
        status: { in: ["SCHEDULED", "IN_PRODUCTION"] },
      },
    }),
    prisma.procBatch.groupBy({
      by: ["productType"],
      where: { ...where, status: { not: "CANCELLED" } },
      _count: { id: true },
    }),
    prisma.procBatch.findMany({
      where,
      include: {
        recipe: { select: { name: true } },
        _count: { select: { qualityChecks: true, labels: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.procQualityCheck.count({ where: { status: "FAILED" } }),
  ]);

  return {
    stats: {
      activeBatches,
      qcPending,
      expiringSoon,
      todaySchedules,
      failedQc,
      recipes: await prisma.procRecipe.count({ where: { ...where, isActive: true } }),
    },
    byProduct: byProduct.map((g) => ({
      productType: g.productType,
      count: g._count.id,
    })),
    recentBatches,
  };
}

// ─── Recipes ─────────────────────────────────────────────────────────────────

export async function listRecipes(tenantId?: string | null, productType?: ProcProductType) {
  return prisma.procRecipe.findMany({
    where: {
      tenantId: tenantId ?? undefined,
      isActive: true,
      ...(productType ? { productType } : {}),
    },
    include: { ingredients: true, _count: { select: { batches: true } } },
    orderBy: [{ productType: "asc" }, { name: "asc" }],
  });
}

export async function createRecipe(
  tenantId: string | null | undefined,
  data: {
    name: string;
    productType: ProcProductType;
    yieldQty: number;
    yieldUnit?: string;
    milkLiters?: number;
    shelfLifeDays?: number;
    instructions?: string;
    ingredients?: RecipeIngredientInput[];
  }
) {
  return prisma.procRecipe.create({
    data: {
      tenantId,
      name: data.name,
      productType: data.productType,
      yieldQty: data.yieldQty,
      yieldUnit: data.yieldUnit ?? "kg",
      milkLiters: data.milkLiters,
      shelfLifeDays: data.shelfLifeDays ?? 7,
      instructions: data.instructions,
      ingredients: data.ingredients?.length ? { create: data.ingredients } : undefined,
    },
    include: { ingredients: true },
  });
}

// ─── Batches (Milk Processing) ───────────────────────────────────────────────

export async function listBatches(
  tenantId?: string | null,
  productType?: ProcProductType,
  status?: ProcBatchStatus
) {
  return prisma.procBatch.findMany({
    where: {
      tenantId: tenantId ?? undefined,
      ...(productType ? { productType } : {}),
      ...(status ? { status } : {}),
    },
    include: {
      recipe: { select: { name: true } },
      createdBy: { select: { name: true } },
      _count: { select: { qualityChecks: true, packaging: true, labels: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createBatch(
  tenantId: string | null | undefined,
  createdById: string,
  data: {
    productType: ProcProductType;
    recipeId?: string;
    milkInputLiters?: number;
    plannedQty?: number;
    yieldUnit?: string;
    notes?: string;
  }
) {
  let shelfLifeDays = 7;
  if (data.recipeId) {
    const recipe = await prisma.procRecipe.findUnique({ where: { id: data.recipeId } });
    if (recipe) shelfLifeDays = recipe.shelfLifeDays;
  }

  const num = batchNumber(data.productType);
  const batch = await prisma.procBatch.create({
    data: {
      tenantId,
      batchNumber: num,
      productType: data.productType,
      recipeId: data.recipeId,
      milkInputLiters: data.milkInputLiters,
      plannedQty: data.plannedQty,
      yieldUnit: data.yieldUnit ?? "kg",
      notes: data.notes,
      createdById,
      expiryDate: addDays(new Date(), shelfLifeDays),
    },
    include: { recipe: true },
  });

  const qcTemplate = DEFAULT_QC_CHECKS[data.productType];
  if (qcTemplate?.length) {
    await prisma.procQualityCheck.createMany({
      data: qcTemplate.map((c) => ({
        batchId: batch.id,
        checkType: "standard",
        parameter: c.parameter,
        expectedValue: c.expectedValue,
        status: "PENDING" as ProcQcStatus,
      })),
    });
  }

  return batch;
}

export async function updateBatchStatus(
  id: string,
  status: ProcBatchStatus,
  data?: { actualQty?: number; notes?: string }
) {
  const extra: Record<string, unknown> = { status, ...data };
  if (status === "IN_PROGRESS") extra.startedAt = new Date();
  if (status === "COMPLETED" || status === "PACKAGED") extra.completedAt = new Date();
  return prisma.procBatch.update({ where: { id }, data: extra });
}

// ─── Production Planning ─────────────────────────────────────────────────────

export async function listSchedules(tenantId?: string | null, fromDate?: string) {
  return prisma.procSchedule.findMany({
    where: {
      tenantId: tenantId ?? undefined,
      ...(fromDate ? { scheduledDate: { gte: new Date(fromDate) } } : {}),
    },
    include: {
      batch: { select: { batchNumber: true, status: true } },
    },
    orderBy: { scheduledDate: "asc" },
  });
}

export async function createSchedule(
  tenantId: string | null | undefined,
  data: {
    productType: ProcProductType;
    plannedQty: number;
    yieldUnit?: string;
    scheduledDate: string;
    milkRequired?: number;
    notes?: string;
  }
) {
  return prisma.procSchedule.create({
    data: {
      tenantId,
      productType: data.productType,
      plannedQty: data.plannedQty,
      yieldUnit: data.yieldUnit ?? "kg",
      scheduledDate: new Date(data.scheduledDate),
      milkRequired: data.milkRequired,
      notes: data.notes,
      status: "SCHEDULED",
    },
  });
}

export async function startScheduleProduction(scheduleId: string, createdById: string) {
  const schedule = await prisma.procSchedule.findUnique({ where: { id: scheduleId } });
  if (!schedule) throw new Error("Schedule not found");

  const recipe = await prisma.procRecipe.findFirst({
    where: { productType: schedule.productType, isActive: true },
  });

  const batch = await createBatch(undefined, createdById, {
    productType: schedule.productType,
    recipeId: recipe?.id,
    plannedQty: Number(schedule.plannedQty),
    yieldUnit: schedule.yieldUnit,
    milkInputLiters: schedule.milkRequired ? Number(schedule.milkRequired) : undefined,
  });

  await prisma.procSchedule.update({
    where: { id: scheduleId },
    data: { status: "IN_PRODUCTION", batchId: batch.id },
  });

  await updateBatchStatus(batch.id, "IN_PROGRESS");
  return batch;
}

// ─── Quality Control ─────────────────────────────────────────────────────────

export async function listQualityChecks(batchId?: string) {
  return prisma.procQualityCheck.findMany({
    where: batchId ? { batchId } : undefined,
    include: {
      batch: { select: { batchNumber: true, productType: true } },
      checkedBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function recordQualityCheck(
  id: string,
  checkedById: string,
  data: { actualValue: string; status: ProcQcStatus; notes?: string }
) {
  return prisma.procQualityCheck.update({
    where: { id },
    data: {
      ...data,
      checkedById,
      checkedAt: new Date(),
    },
  });
}

export async function finalizeBatchQc(batchId: string) {
  const checks = await prisma.procQualityCheck.findMany({ where: { batchId } });
  const hasFailed = checks.some((c) => c.status === "FAILED");
  const allDone = checks.every((c) => c.status === "PASSED" || c.status === "FAILED");

  if (!allDone) {
    await prisma.procBatch.update({ where: { id: batchId }, data: { status: "QC_PENDING" } });
    return { status: "QC_PENDING" as const };
  }

  const status = hasFailed ? "REJECTED" : "APPROVED";
  await prisma.procBatch.update({ where: { id: batchId }, data: { status } });
  return { status };
}

// ─── Packaging ───────────────────────────────────────────────────────────────

export async function listPackaging(batchId?: string) {
  return prisma.procPackaging.findMany({
    where: batchId ? { batchId } : undefined,
    include: {
      batch: { select: { batchNumber: true, productType: true, expiryDate: true } },
      _count: { select: { labels: true } },
    },
    orderBy: { packagedAt: "desc" },
  });
}

export async function createPackaging(data: {
  batchId: string;
  packagingType?: ProcPackagingType;
  unitSize?: string;
  unitCount?: number;
  totalQty: number;
  notes?: string;
  generateLabels?: boolean;
}) {
  const batch = await prisma.procBatch.findUnique({ where: { id: data.batchId } });
  if (!batch) throw new Error("Batch not found");

  const packaging = await prisma.procPackaging.create({
    data: {
      batchId: data.batchId,
      packagingType: data.packagingType ?? "POUCH",
      unitSize: data.unitSize,
      unitCount: data.unitCount ?? 1,
      totalQty: data.totalQty,
      notes: data.notes,
    },
  });

  if (data.generateLabels !== false) {
    await generateLabelsForPackaging(packaging.id, data.unitCount ?? 1);
  }

  await prisma.procBatch.update({
    where: { id: data.batchId },
    data: { status: "PACKAGED" },
  });

  return packaging;
}

// ─── Barcode / QR / Expiry ───────────────────────────────────────────────────

export async function generateLabelsForPackaging(packagingId: string, count = 1) {
  const packaging = await prisma.procPackaging.findUnique({
    where: { id: packagingId },
    include: { batch: true },
  });
  if (!packaging?.batch) throw new Error("Packaging not found");

  const batch = packaging.batch;
  const expiry = batch.expiryDate ?? addDays(new Date(), 7);
  const expiryStr = expiry.toISOString().slice(0, 10);
  const labels = [];

  for (let i = 1; i <= count; i++) {
    const barcode = generateBarcode(batch.batchNumber, i);
    const qrPayload = buildQrPayload({
      batchNumber: batch.batchNumber,
      productType: batch.productType,
      barcode,
      expiryDate: expiryStr,
      qty: packaging.unitSize ?? undefined,
    });
    const label = await prisma.procLabel.create({
      data: {
        batchId: batch.id,
        packagingId,
        productType: batch.productType,
        barcode,
        qrPayload,
        expiryDate: expiry,
      },
    });
    labels.push(label);
  }

  return labels;
}

export async function listLabels(batchId?: string, expiringWithinDays?: number) {
  const expiryFilter = expiringWithinDays
    ? { expiryDate: { lte: addDays(new Date(), expiringWithinDays), gte: new Date() } }
    : {};

  return prisma.procLabel.findMany({
    where: {
      ...(batchId ? { batchId } : {}),
      ...expiryFilter,
    },
    include: {
      batch: { select: { batchNumber: true } },
      packaging: { select: { unitSize: true, packagingType: true } },
    },
    orderBy: { expiryDate: "asc" },
    take: 200,
  });
}

export async function getLabelByBarcode(barcode: string) {
  return prisma.procLabel.findUnique({
    where: { barcode },
    include: {
      batch: { include: { recipe: true, qualityChecks: true } },
      packaging: true,
    },
  });
}

export { batchNumber, buildQrPayload };
