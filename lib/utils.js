export function getSavePercent(price, compareAtPrice) {
  if (!compareAtPrice || compareAtPrice <= price) return 0;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

export function getProductById(products, id) {
  return products.find((p) => p.id === id);
}

export function getProductsByIds(products, ids) {
  return ids.map((id) => getProductById(products, id)).filter(Boolean);
}

export function resolveProductSections(products, sections) {
  return sections.map((section) => ({
    ...section,
    products: getProductsByIds(products, section.productIds),
  }));
}

export function buildFooterProductLinks(products) {
  return products
    .filter((p) => p.category !== "combo")
    .map((p) => ({ label: p.name, href: "#products" }));
}
