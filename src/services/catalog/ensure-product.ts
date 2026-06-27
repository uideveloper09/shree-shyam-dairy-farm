import { readFileSync } from "node:fs";
import path from "node:path";
import { prisma } from "@/repositories/prisma";

interface ContentCatalogProduct {
  id: number;
  name: string;
  price: number;
  compareAtPrice?: number;
  unit?: string;
  category: string;
  image?: string;
  inStock?: boolean;
}

interface ContentCatalog {
  categories?: Array<{ slug: string; label: string; image?: string; id?: number }>;
  products?: ContentCatalogProduct[];
}

let cachedCatalog: ContentCatalog | null = null;

function loadContentCatalog(): ContentCatalog {
  if (cachedCatalog) return cachedCatalog;

  const contentPath = path.join(process.cwd(), "data", "content.json");
  cachedCatalog = JSON.parse(readFileSync(contentPath, "utf-8")) as ContentCatalog;
  return cachedCatalog;
}

function slugifyName(name: string, legacyId: number): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${base}-${legacyId}`;
}

async function ensureCategory(slug: string, content: ContentCatalog): Promise<string> {
  const existing = await prisma.category.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (existing) return existing.id;

  const fromContent = content.categories?.find((c) => c.slug === slug);

  const created = await prisma.category.create({
    data: {
      slug,
      name: fromContent?.label ?? slug,
      image: fromContent?.image ?? null,
      sortOrder: fromContent?.id ?? 0,
    },
    select: { id: true },
  });

  return created.id;
}

/**
 * Ensures a storefront product exists in the database for checkout/inventory.
 * Syncs from data/content.json when missing (production-safe bootstrap).
 */
export async function ensureProductByLegacyId(legacyId: number) {
  const existing = await prisma.product.findFirst({
    where: { legacyId, isActive: true },
    select: { id: true, name: true, price: true, unit: true },
  });

  if (existing) return existing;

  const content = loadContentCatalog();
  const source = content.products?.find((p) => p.id === legacyId);

  if (!source) {
    throw new Error(`Product not found for cart item id: ${legacyId}`);
  }

  const categoryId = await ensureCategory(source.category, content);

  return prisma.product.upsert({
    where: { legacyId },
    update: {
      name: source.name,
      price: source.price,
      mrp: source.compareAtPrice ?? source.price,
      unit: source.unit || "unit",
      images: source.image ? [source.image] : [],
      inStock: source.inStock !== false,
      isActive: true,
      categoryId,
    },
    create: {
      legacyId,
      slug: slugifyName(source.name, legacyId),
      name: source.name,
      price: source.price,
      mrp: source.compareAtPrice ?? source.price,
      unit: source.unit || "unit",
      images: source.image ? [source.image] : [],
      inStock: source.inStock !== false,
      isSubscription: source.category === "milk",
      isActive: true,
      categoryId,
    },
    select: { id: true, name: true, price: true, unit: true },
  });
}
