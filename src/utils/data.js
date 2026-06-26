import { cache } from "react";
import { readFile, writeFile } from "fs/promises";
import path from "path";
import { buildFooterProductLinks, resolveProductSections } from "@/utils/utils";
import { categoryPath } from "@/utils/routes";

const DATA_DIR = path.join(process.cwd(), "data");

async function readJson(filename) {
  const filePath = path.join(DATA_DIR, filename);
  const raw = await readFile(filePath, "utf-8");
  return JSON.parse(raw);
}

async function writeJson(filename, data) {
  const filePath = path.join(DATA_DIR, filename);
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf-8");
}

function enrichContent(raw) {
  const productSections = resolveProductSections(raw.products, raw.productSections);

  const categories = (raw.categories ?? []).map((category) => ({
    ...category,
    href: category.href?.startsWith("/") ? category.href : categoryPath(category.slug),
  }));

  const footerLinks = {
    quick: raw.footerLinks?.quick ?? [],
    products: buildFooterProductLinks(raw.products, categories),
  };

  return {
    ...raw,
    categories,
    productSections,
    footerLinks,
  };
}

export const getContent = cache(async () => {
  const raw = await readJson("content.json");
  return enrichContent(raw);
});

export async function saveContent(content) {
  const { productSections: _sections, footerLinks: _footer, ...persistable } = content;
  await writeJson("content.json", persistable);
  return enrichContent(persistable);
}

export async function getProducts(filters = {}) {
  const { products } = await getContent();
  let result = products.filter((p) => p.inStock !== false);

  if (filters.category) {
    result = result.filter((p) => p.category === filters.category);
  }

  if (filters.sectionId) {
    const { productSections } = await getContent();
    const section = productSections.find((s) => s.id === filters.sectionId);
    if (section) {
      const ids = new Set(section.productIds);
      result = result.filter((p) => ids.has(p.id));
    }
  }

  if (filters.ids) {
    const idSet = new Set(filters.ids);
    result = result.filter((p) => idSet.has(p.id));
  }

  return result;
}

export async function getCategoryBySlug(slug) {
  const content = await getContent();
  const category = content.categories.find((c) => c.slug === slug);
  if (!category) return null;

  let products = content.products.filter((p) => p.inStock !== false && p.category !== "combo");

  if (slug === "paneer") {
    products = products.filter((p) => p.name.toLowerCase().includes("paneer"));
  } else if (slug === "curd") {
    products = products.filter((p) => p.category === "curd");
  } else {
    products = products.filter((p) => p.category === slug);
  }

  return { category, products };
}

export async function getCategorySlugs() {
  const { categories } = await getContent();
  return categories.map((c) => c.slug);
}

export async function addInquiry(inquiry) {
  const inquiries = await readJson("inquiries.json");
  const entry = {
    id: crypto.randomUUID(),
    ...inquiry,
    createdAt: new Date().toISOString(),
  };
  inquiries.unshift(entry);
  await writeJson("inquiries.json", inquiries);
  return entry;
}

export async function addSubscriber(email) {
  const subscribers = await readJson("subscribers.json");
  const exists = subscribers.some((s) => s.email.toLowerCase() === email.toLowerCase());
  if (exists) return { duplicate: true };

  const entry = {
    id: crypto.randomUUID(),
    email,
    createdAt: new Date().toISOString(),
  };
  subscribers.unshift(entry);
  await writeJson("subscribers.json", subscribers);
  return entry;
}

export async function saveOrder(order) {
  const orders = await readJson("orders.json");
  const entry = {
    id: crypto.randomUUID(),
    ...order,
    createdAt: new Date().toISOString(),
  };
  orders.unshift(entry);
  await writeJson("orders.json", orders);
  return entry;
}
