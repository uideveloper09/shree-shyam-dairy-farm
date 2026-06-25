"use client";

import { useRef, useState, useEffect } from "react";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi";
import SectionLink from "@/components/ui/SectionLink";
import SectionHeading from "@/components/ui/SectionHeading";
import ProductCard from "@/components/ui/ProductCard";
import {
  CONTAINER,
  SECTION_CREAM,
  SECTION_WHITE,
  CAROUSEL_WRAP,
  CAROUSEL_TRACK,
  SECTION_HEAD,
} from "@/lib/layout";

export default function ProductCarousel({
  label,
  title,
  products = [],
  viewAllHref = "#products",
  id,
  bg = "white",
}) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [products]);

  const scroll = (direction) => {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.querySelector("article");
    const step = card ? card.offsetWidth + 12 : el.clientWidth * 0.85;
    el.scrollBy({ left: direction * step, behavior: "smooth" });
  };

  if (!products.length) return null;

  const sectionClass = bg === "gray" ? SECTION_CREAM : SECTION_WHITE;

  return (
    <section id={id} className={sectionClass}>
      <div className={CONTAINER}>
        <div className={`${SECTION_HEAD} flex items-end justify-between gap-3 sm:gap-4`}>
          <SectionHeading label={label} title={title} align="left" className="mb-0 min-w-0" />
          {viewAllHref && (
            <SectionLink href={viewAllHref} className="link-premium hidden shrink-0 sm:inline-flex">
              View all →
            </SectionLink>
          )}
        </div>

        <div className={CAROUSEL_WRAP}>
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => scroll(-1)}
              aria-label="Scroll left"
              className="carousel-nav-btn absolute left-0 top-[38%] z-10 hidden -translate-y-1/2 md:flex lg:-left-5"
            >
              <HiChevronLeft size={22} />
            </button>
          )}

          <div ref={scrollRef} className={CAROUSEL_TRACK}>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {canScrollRight && (
            <button
              type="button"
              onClick={() => scroll(1)}
              aria-label="Scroll right"
              className="carousel-nav-btn absolute right-0 top-[38%] z-10 hidden -translate-y-1/2 md:flex lg:-right-5"
            >
              <HiChevronRight size={22} />
            </button>
          )}
        </div>

        {viewAllHref && (
          <div className="mt-6 text-center sm:hidden">
            <SectionLink href={viewAllHref} className="link-premium">
              View all →
            </SectionLink>
          </div>
        )}
      </div>
    </section>
  );
}
