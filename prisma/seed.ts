import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import path from "path";

const prisma = new PrismaClient();

async function main() {
  const contentPath = path.join(process.cwd(), "data", "content.json");
  const content = JSON.parse(readFileSync(contentPath, "utf-8"));

  for (const cat of content.categories ?? []) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, image: cat.image },
      create: {
        slug: cat.slug,
        name: cat.name,
        image: cat.image,
        sortOrder: cat.id ?? 0,
      },
    });
  }

  for (const product of content.products ?? []) {
    const category = await prisma.category.findUnique({
      where: { slug: product.category },
    });
    if (!category) continue;

    const slug = product.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    await prisma.product.upsert({
      where: { legacyId: product.id },
      update: {
        name: product.name,
        price: product.price,
        mrp: product.mrp ?? product.price,
        images: product.image ? [product.image] : [],
        inStock: product.inStock !== false,
        categoryId: category.id,
      },
      create: {
        legacyId: product.id,
        slug: `${slug}-${product.id}`,
        name: product.name,
        price: product.price,
        mrp: product.mrp ?? product.price,
        unit: product.unit || "unit",
        images: product.image ? [product.image] : [],
        inStock: product.inStock !== false,
        isSubscription: product.category === "milk",
        categoryId: category.id,
      },
    });
  }

  for (const coupon of content.cart?.coupons ?? []) {
    await prisma.coupon.upsert({
      where: { code: coupon.code },
      update: {
        type: coupon.type,
        value: coupon.value,
        isActive: true,
      },
      create: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        isActive: true,
      },
    });
  }

  console.log("Seed complete: categories, products, coupons");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
