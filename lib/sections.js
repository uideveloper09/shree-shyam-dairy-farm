/** Homepage section IDs — single source of truth for nav + scroll targets */
export const HOME_SECTIONS = {
  HOME: "home",
  PRODUCTS: "products",
  CATEGORIES: "categories",
  QUALITY: "quality",
  ABOUT: "about",
  FARM: "farm",
  CONTACT: "contact",
};

/** Config-only href (never used in browser URL) */
export function sectionTarget(id) {
  return `#${id}`;
}

/** Full homepage scroll order — used to preload sections above the scroll target */
export function buildHomeSectionOrder(productSections = []) {
  const carouselIds = productSections.map((section) =>
    section.id === "best-value" ? HOME_SECTIONS.PRODUCTS : section.id
  );

  return [
    ...carouselIds,
    HOME_SECTIONS.CATEGORIES,
    HOME_SECTIONS.QUALITY,
    HOME_SECTIONS.ABOUT,
    HOME_SECTIONS.FARM,
    HOME_SECTIONS.CONTACT,
  ];
}
