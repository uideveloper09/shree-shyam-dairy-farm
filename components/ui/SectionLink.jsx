"use client";

import Link from "next/link";
import { resolveNavHref, isSectionLink } from "@/lib/routes";
import { useSectionScroll } from "@/context/SectionScrollContext";

export default function SectionLink({
  href,
  className,
  children,
  onSectionClick,
  onClick,
  ...props
}) {
  const { handleSectionClick } = useSectionScroll();

  if (!isSectionLink(href)) {
    return (
      <Link href={href} className={className} onClick={onClick} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <Link
      href={resolveNavHref(href)}
      className={className}
      onClick={(e) => {
        const id = handleSectionClick(e, href);
        if (id) onSectionClick?.(id);
        onClick?.(e);
      }}
      {...props}
    >
      {children}
    </Link>
  );
}
