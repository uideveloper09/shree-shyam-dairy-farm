export function categoryPath(slug) {
  return `/category/${slug}`;
}

export const SECTION_SCROLL_EVENT = "section-scroll-request";

export function isHashHref(href) {
  return typeof href === "string" && href.startsWith("#");
}

/** Internal homepage section link, e.g. #about (config only — never in browser URL) */
export function isSectionLink(href) {
  return isHashHref(href) || (typeof href === "string" && href.startsWith("/#"));
}

export function getSectionId(href) {
  if (typeof href === "string" && !href.includes("#")) {
    return href.split("#").filter(Boolean)[0] || "";
  }

  let fragment = href;
  if (fragment.startsWith("/#")) fragment = fragment.slice(1);
  if (fragment.startsWith("#")) fragment = fragment.slice(1);
  return fragment.split("#").filter(Boolean)[0] || "";
}

/** Section links always resolve to / — scroll is handled client-side */
export function resolveNavHref(href) {
  if (!href) return "/";
  if (isSectionLink(href)) return "/";
  return href;
}
