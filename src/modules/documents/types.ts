import type { DocumentCategory } from "@prisma/client";

export const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  GENERAL: "Documents",
  INVOICE: "Invoices",
  CERTIFICATE: "Certificates",
  VACCINATION: "Vaccination Documents",
  PURCHASE_BILL: "Purchase Bills",
  EMPLOYEE: "Employee Documents",
  CONTRACT: "Contracts",
};

export const DEFAULT_FOLDERS: { name: string; slug: string; category: DocumentCategory }[] = [
  { name: "Invoices", slug: "invoices", category: "INVOICE" },
  { name: "Certificates", slug: "certificates", category: "CERTIFICATE" },
  { name: "Vaccination Records", slug: "vaccination", category: "VACCINATION" },
  { name: "Purchase Bills", slug: "purchase-bills", category: "PURCHASE_BILL" },
  { name: "Employee Documents", slug: "employee", category: "EMPLOYEE" },
  { name: "Contracts", slug: "contracts", category: "CONTRACT" },
  { name: "General", slug: "general", category: "GENERAL" },
];

export type UploadInput = {
  title: string;
  fileName: string;
  mimeType: string;
  buffer: Buffer;
  category?: DocumentCategory;
  folderId?: string;
  tenantId?: string | null;
  uploadedById: string;
  metadata?: Record<string, unknown>;
  tags?: string[];
};

export type SignDocumentInput = {
  documentId: string;
  signerId: string;
  signerName: string;
  signatureData: string;
  ipAddress?: string;
  version?: number;
};
