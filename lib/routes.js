export function categoryPath(slug) {
  return `/category/${slug}`;
}

export function isHashHref(href) {
  return typeof href === "string" && href.startsWith("#");
}

export function resolveNavHref(href, pathname = "/") {
  if (!href) return "/";
  if (!isHashHref(href)) return href;
  if (pathname === "/") return href;
  return `/${href}`;
}
