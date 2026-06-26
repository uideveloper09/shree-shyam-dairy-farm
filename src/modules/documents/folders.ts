import { prisma } from "@/repositories/prisma";
import { DEFAULT_FOLDERS } from "@/modules/documents/types";

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function createFolder(data: {
  name: string;
  parentId?: string;
  tenantId?: string | null;
  createdById: string;
}) {
  let path = `/${slugify(data.name)}`;
  if (data.parentId) {
    const parent = await prisma.documentFolder.findUnique({ where: { id: data.parentId } });
    if (!parent) throw new Error("Parent folder not found");
    path = `${parent.path}/${slugify(data.name)}`;
  }

  return prisma.documentFolder.create({
    data: {
      name: data.name,
      slug: slugify(data.name),
      path,
      parentId: data.parentId,
      tenantId: data.tenantId,
      createdById: data.createdById,
    },
  });
}

export async function listFolders(tenantId?: string | null, parentId?: string | null) {
  return prisma.documentFolder.findMany({
    where: {
      tenantId: tenantId ?? undefined,
      parentId: parentId ?? null,
    },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { documents: true, children: true } },
    },
  });
}

export async function getFolderTree(tenantId?: string | null) {
  const folders = await prisma.documentFolder.findMany({
    where: { tenantId: tenantId ?? undefined },
    orderBy: { path: "asc" },
    include: { _count: { select: { documents: true } } },
  });
  return folders;
}

export async function seedDefaultFolders(createdById: string, tenantId?: string | null) {
  const created = [];
  for (const f of DEFAULT_FOLDERS) {
    const path = `/${f.slug}`;
    const existing = await prisma.documentFolder.findFirst({
      where: { tenantId: tenantId ?? null, path },
    });
    if (existing) {
      created.push(existing);
      continue;
    }
    const folder = await prisma.documentFolder.create({
      data: {
        name: f.name,
        slug: f.slug,
        path,
        tenantId,
        createdById,
      },
    });
    created.push(folder);
  }
  return created;
}

export async function findFolderByCategory(category: string, tenantId?: string | null) {
  const slugMap: Record<string, string> = {
    INVOICE: "invoices",
    CERTIFICATE: "certificates",
    VACCINATION: "vaccination",
    PURCHASE_BILL: "purchase-bills",
    EMPLOYEE: "employee",
    CONTRACT: "contracts",
    GENERAL: "general",
  };
  const slug = slugMap[category] || "general";
  return prisma.documentFolder.findFirst({
    where: { tenantId: tenantId ?? null, slug },
  });
}
