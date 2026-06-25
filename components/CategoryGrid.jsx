"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import LazyImage from "@/components/ui/LazyImage";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi";
import SectionHeading from "@/components/ui/SectionHeading";
import { useSiteData } from "@/context/SiteDataContext";
import {
  CONTAINER,
  SECTION_WHITE,
  CAROUSEL_WRAP,
  CAROUSEL_TRACK,
  SECTION_HEAD,
} from "@/lib/layout";

function CategoryCard({ category }) {
  return (
    <Link
      href={category.href}
      className="premium-card group flex w-[calc(100vw-5rem)] max-w-[260px] shrink-0 snap-center scroll-mt-28 flex-col overflow-hidden sm:w-[260px] sm:max-w-none sm:snap-start"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-[#faf9f6]">
        <LazyImage
          src={category.image}
          alt={category.label}
          fill
          className="object-cover group-hover:scale-105"
          sizes="260px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#061E3D]/70 via-transparent to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
        <span className="absolute bottom-4 left-4 translate-y-2 text-[12px] font-bold uppercase tracking-wide text-white opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          Explore →
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-heading text-lg font-bold text-[#082F63]">{category.label}</h3>
        <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-gray-500">
          {category.desc}
        </p>
      </div>
    </Link>
  );
}

export default function CategoryGrid() {
  const { categories, categorySection } = useSiteData();
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
  }, [categories]);

  const scroll = (direction) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: "smooth" });
  };

  return (
    <section id="categories" className={SECTION_WHITE}>
      <div className={CONTAINER}>
        <div className={SECTION_HEAD}>
          <SectionHeading
            label={categorySection.label}
            title={categorySection.title}
            align="left"
            className="mb-0"
          />
        </div>

        <div className={CAROUSEL_WRAP}>
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => scroll(-1)}
              aria-label="Scroll left"
              className="carousel-nav-btn absolute left-0 top-[35%] z-10 hidden -translate-y-1/2 md:flex lg:-left-5"
            >
              <HiChevronLeft size={22} />
            </button>
          )}

          <div ref={scrollRef} className={CAROUSEL_TRACK}>
            {categories.map((cat) => (
              <CategoryCard key={cat.slug} category={cat} />
            ))}
          </div>

          {canScrollRight && (
            <button
              type="button"
              onClick={() => scroll(1)}
              aria-label="Scroll right"
              className="carousel-nav-btn absolute right-0 top-[35%] z-10 hidden -translate-y-1/2 md:flex lg:-right-5"
            >
              <HiChevronRight size={22} />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
