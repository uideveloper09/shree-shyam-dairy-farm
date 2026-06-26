import type {
  ProcBatchStatus,
  ProcPackagingType,
  ProcProductType,
  ProcQcStatus,
  ProcScheduleStatus,
} from "@prisma/client";

export const PRODUCT_TYPE_LABELS: Record<ProcProductType, string> = {
  RAW_MILK: "Raw Milk",
  PANEER: "Paneer",
  CURD: "Curd",
  BUTTER: "Butter",
  GHEE: "Ghee",
  KHOYA: "Khoya",
  LASSI: "Lassi",
  FLAVOURED_MILK: "Flavoured Milk",
};

export const DAIRY_PRODUCT_TYPES: ProcProductType[] = [
  "PANEER",
  "CURD",
  "BUTTER",
  "GHEE",
  "KHOYA",
  "LASSI",
  "FLAVOURED_MILK",
];

export const BATCH_STATUS_LABELS: Record<ProcBatchStatus, string> = {
  PLANNED: "Planned",
  IN_PROGRESS: "In Progress",
  QC_PENDING: "QC Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  PACKAGED: "Packaged",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const QC_STATUS_LABELS: Record<ProcQcStatus, string> = {
  PENDING: "Pending",
  PASSED: "Passed",
  FAILED: "Failed",
  HOLD: "On Hold",
};

export const PACKAGING_TYPE_LABELS: Record<ProcPackagingType, string> = {
  CUP: "Cup",
  POUCH: "Pouch",
  TIN: "Tin",
  BOX: "Box",
  BOTTLE: "Bottle",
  BULK: "Bulk",
};

export const SCHEDULE_STATUS_LABELS: Record<ProcScheduleStatus, string> = {
  DRAFT: "Draft",
  SCHEDULED: "Scheduled",
  IN_PRODUCTION: "In Production",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export type RecipeIngredientInput = {
  name: string;
  quantity: number;
  unit: string;
};

export const DEFAULT_QC_CHECKS: Record<string, { parameter: string; expectedValue: string }[]> = {
  PANEER: [
    { parameter: "Moisture %", expectedValue: "50-55" },
    { parameter: "Fat %", expectedValue: "20-22" },
    { parameter: "pH", expectedValue: "5.8-6.2" },
  ],
  CURD: [
    { parameter: "Acidity %", expectedValue: "0.8-1.0" },
    { parameter: "Texture", expectedValue: "Firm, no whey separation" },
  ],
  GHEE: [
    { parameter: "Moisture %", expectedValue: "<0.3" },
    { parameter: "FFA %", expectedValue: "<1.0" },
  ],
  BUTTER: [
    { parameter: "Fat %", expectedValue: ">80" },
    { parameter: "Salt %", expectedValue: "1.5-2.0" },
  ],
  LASSI: [
    { parameter: "Brix", expectedValue: "8-12" },
    { parameter: "pH", expectedValue: "4.0-4.5" },
  ],
  FLAVOURED_MILK: [
    { parameter: "Fat %", expectedValue: "3.0-4.5" },
    { parameter: "Brix", expectedValue: "12-16" },
  ],
  KHOYA: [
    { parameter: "Moisture %", expectedValue: "20-25" },
    { parameter: "Fat %", expectedValue: "25-30" },
  ],
};
