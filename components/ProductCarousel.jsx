"use client";

import { useRef, useState, useEffect } from "react";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi";
import SectionHeading from "@/components/ui/SectionHeading";
import ProductCard from "@/components/ui/ProductCard";
import { CONTAINER, SECTION_CREAM, SECTION_WHITE } from "@/lib/layout";

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
    el.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: "smooth" });
  };

  if (!products.length) return null;

  const sectionClass = bg === "gray" ? SECTION_CREAM : SECTION_WHITE;

  return (
    <section id={id} className={sectionClass}>
      <div className={CONTAINER}>
        <div className="mb-10 flex items-end justify-between gap-4 border-b border-[#eee] pb-6">
          <SectionHeading label={label} title={title} align="left" className="mb-0" />
          {viewAllHref && (
            <a href={viewAllHref} className="link-premium hidden shrink-0 sm:inline-flex">
              View all →
            </a>
          )}
        </div>

        <div className="relative">
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => scroll(-1)}
              aria-label="Scroll left"
              className="carousel-nav-btn absolute -left-3 top-[38%] z-10 hidden -translate-y-1/2 sm:flex lg:-left-5"
            >
              <HiChevronLeft size={22} />
            </button>
          )}

          <div
            ref={scrollRef}
            className="flex gap-5 overflow-x-auto scroll-smooth pb-2 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {canScrollRight && (
            <button
              type="button"
              onClick={() => scroll(1)}
              aria-label="Scroll right"
              className="carousel-nav-btn absolute -right-3 top-[38%] z-10 hidden -translate-y-1/2 sm:flex lg:-right-5"
            >
              <HiChevronRight size={22} />
            </button>
          )}
        </div>

        {viewAllHref && (
          <div className="mt-8 text-center sm:hidden">
            <a href={viewAllHref} className="link-premium">
              View all →
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
