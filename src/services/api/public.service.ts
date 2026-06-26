import { prisma, isDatabaseConfigured } from "@/repositories/prisma";
import { getProducts } from "@/utils/data";

export async function listPublicProducts(opts: {
  category?: string;
  limit?: number;
  offset?: number;
}) {
  const limit = Math.min(opts.limit ?? 50, 100);
  const offset = opts.offset ?? 0;

  if (isDatabaseConfigured()) {
    const products = await prisma.product.findMany({
      where: opts.category
        ? { category: { slug: opts.category }, inStock: true }
        : { inStock: true },
      take: limit,
      skip: offset,
      orderBy: { name: "asc" },
      select: {
        id: true,
        slug: true,
        name: true,
        shortDesc: true,
        price: true,
        mrp: true,
        unit: true,
        weight: true,
        images: true,
        inStock: true,
        rating: true,
        reviewCount: true,
        category: { select: { slug: true, name: true } },
      },
    });
    return products.map(serializeProduct);
  }

  const fromJson = await getProducts({ category: opts.category });
  return fromJson.slice(offset, offset + limit).map((p: Record<string, unknown>) => ({
    id: String(p.id),
    slug: p.slug || String(p.id),
    name: p.name,
    shortDesc: p.shortDesc,
    price: Number(p.price),
    unit: p.unit || "unit",
    inStock: p.inStock !== false,
    category: p.category,
  }));
}

export async function getPublicProduct(idOrSlug: string) {
  if (isDatabaseConfigured()) {
    const product = await prisma.product.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        shortDesc: true,
        price: true,
        mrp: true,
        unit: true,
        weight: true,
        images: true,
        benefits: true,
        storage: true,
        inStock: true,
        rating: true,
        reviewCount: true,
        category: { select: { slug: true, name: true } },
      },
    });
    return product ? serializeProduct(product) : null;
  }

  const products = await getProducts({});
  const found = products.find(
    (p: Record<string, unknown>) => String(p.id) === idOrSlug || p.slug === idOrSlug
  );
  if (!found) return null;
  return {
    id: String(found.id),
    slug: found.slug,
    name: found.name,
    price: Number(found.price),
    unit: found.unit,
    inStock: found.inStock !== false,
  };
}

export async function getPublicOrder(orderNumber: string) {
  if (!isDatabaseConfigured()) return null;

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      paymentStatus: true,
      total: true,
      deliveryDate: true,
      deliverySlot: true,
      deliveredAt: true,
      createdAt: true,
      items: { select: { name: true, quantity: true, price: true, unit: true } },
    },
  });

  if (!order) return null;
  return {
    ...order,
    total: Number(order.total),
    items: order.items.map((i) => ({ ...i, price: Number(i.price) })),
  };
}

function serializeProduct(p: Record<string, unknown>) {
  return {
    ...p,
    price: p.price != null ? Number(p.price) : null,
    mrp: p.mrp != null ? Number(p.mrp) : null,
    rating: p.rating != null ? Number(p.rating) : null,
  };
}
