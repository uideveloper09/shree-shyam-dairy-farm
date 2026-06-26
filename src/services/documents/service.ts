import { prisma } from "@/repositories/prisma";
import { uploadFile } from "@/lib/ops/storage";
import type { UploadInput } from "@/modules/documents/types";
import type { DocumentCategory } from "@prisma/client";
import { randomBytes } from "crypto";

function buildStorageKey(
  tenantId: string | null | undefined,
  category: DocumentCategory,
  fileName: string
) {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const prefix = tenantId ? `tenants/${tenantId}` : "global";
  return `${prefix}/documents/${category.toLowerCase()}/${Date.now()}_${randomBytes(4).toString("hex")}_${safeName}`;
}

export async function uploadDocument(input: UploadInput) {
  const category = input.category ?? "GENERAL";
  const storageKey = buildStorageKey(input.tenantId, category, input.fileName);

  const { url } = await uploadFile(storageKey, input.buffer, input.mimeType);

  const doc = await prisma.document.create({
    data: {
      tenantId: input.tenantId,
      folderId: input.folderId,
      category,
      title: input.title,
      fileName: input.fileName,
      mimeType: input.mimeType,
      sizeBytes: input.buffer.length,
      storageKey,
      storageUrl: url,
      uploadedById: input.uploadedById,
      metadata: input.metadata as object,
      tags: input.tags as object,
      versions: {
        create: {
          version: 1,
          fileName: input.fileName,
          mimeType: input.mimeType,
          sizeBytes: input.buffer.length,
          storageKey,
          storageUrl: url,
          uploadedById: input.uploadedById,
          changeNote: "Initial upload",
        },
      },
    },
    include: { folder: true, versions: true },
  });

  return doc;
}

export async function uploadNewVersion(
  documentId: string,
  uploadedById: string,
  fileName: string,
  mimeType: string,
  buffer: Buffer,
  changeNote?: string
) {
  const doc = await prisma.document.findUnique({ where: { id: documentId } });
  if (!doc) throw new Error("Document not found");

  const newVersion = doc.currentVersion + 1;
  const storageKey = buildStorageKey(doc.tenantId, doc.category, fileName);
  const { url } = await uploadFile(storageKey, buffer, mimeType);

  const [version] = await prisma.$transaction([
    prisma.documentVersion.create({
      data: {
        documentId,
        version: newVersion,
        fileName,
        mimeType,
        sizeBytes: buffer.length,
        storageKey,
        storageUrl: url,
        uploadedById,
        changeNote,
      },
    }),
    prisma.document.update({
      where: { id: documentId },
      data: {
        currentVersion: newVersion,
        fileName,
        mimeType,
        sizeBytes: buffer.length,
        storageKey,
        storageUrl: url,
      },
    }),
  ]);

  return version;
}

export async function getDocumentVersions(documentId: string) {
  return prisma.documentVersion.findMany({
    where: { documentId },
    orderBy: { version: "desc" },
  });
}

export async function getDocumentById(id: string) {
  return prisma.document.findUnique({
    where: { id },
    include: {
      folder: true,
      uploadedBy: { select: { id: true, name: true, email: true } },
      versions: { orderBy: { version: "desc" }, take: 20 },
      signatures: { orderBy: { signedAt: "desc" }, take: 10 },
      ocrResults: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });
}

export async function listDocuments(opts: {
  tenantId?: string | null;
  folderId?: string;
  category?: DocumentCategory;
  uploadedById?: string;
  limit?: number;
}) {
  return prisma.document.findMany({
    where: {
      tenantId: opts.tenantId ?? undefined,
      folderId: opts.folderId,
      category: opts.category,
      uploadedById: opts.uploadedById,
      isArchived: false,
    },
    orderBy: { createdAt: "desc" },
    take: opts.limit ?? 50,
    include: {
      folder: { select: { id: true, name: true, path: true } },
      uploadedBy: { select: { id: true, name: true } },
      _count: { select: { versions: true, signatures: true } },
    },
  });
}

export async function archiveDocument(id: string) {
  return prisma.document.update({
    where: { id },
    data: { isArchived: true },
  });
}

export async function getDocumentStats(tenantId?: string | null) {
  const byCategory = await prisma.document.groupBy({
    by: ["category"],
    where: { tenantId: tenantId ?? undefined, isArchived: false },
    _count: true,
    _sum: { sizeBytes: true },
  });

  const total = await prisma.document.count({
    where: { tenantId: tenantId ?? undefined, isArchived: false },
  });

  return { total, byCategory };
}
