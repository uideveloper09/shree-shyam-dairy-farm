"use client";

/**

 * OrderButton — pixel-perfect

 * ────────────────────────────

 * Spec: height 48px, padding 16px 32px, font 15px 600 uppercase

 * Navy  bg  → hover #0B3D7A

 * White bg  → hover bg-gray-100  (CTA variant)

 */

import { FaArrowRight } from "react-icons/fa";

import { isSectionLink, resolveNavHref } from "@/utils/routes";

import { useSectionScroll } from "@/features/cart/context/SectionScrollContext";

export default function OrderButton({
  href = "#contact",

  variant = "primary",

  className = "",

  children = "Order Now",

  showArrow = true,

  onClick,
}) {
  const { handleSectionClick } = useSectionScroll();

  const resolvedHref = resolveNavHref(href);

  const handleClick = (e) => {
    if (isSectionLink(href)) {
      handleSectionClick(e, href);
    }

    onClick?.(e);
  };

  const base =
    "inline-flex items-center justify-center gap-2.5 rounded-md font-semibold uppercase tracking-wider leading-none whitespace-nowrap transition duration-200";

  const variants = {
    primary: "h-12 px-8 bg-[#082F63] text-white text-[15px] hover:bg-[#0B3D7A]",

    white: "h-12 px-8 bg-white   text-[#082F63] text-[15px] hover:bg-gray-100",

    nav: "h-12 px-7 bg-[#082F63] text-white text-[13px]   hover:bg-[#0B3D7A]",
  };

  return (
    <a
      href={resolvedHref}
      onClick={handleClick}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {children}

      {showArrow && <FaArrowRight size={10} />}
    </a>
  );
}
