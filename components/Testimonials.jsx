"use client";

import { useState, useEffect, useCallback } from "react";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi";
import { FaStar, FaQuoteLeft } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import SectionHeading from "@/components/ui/SectionHeading";
import { useSiteData } from "@/context/SiteDataContext";
import { CONTAINER, SECTION_CREAM, SECTION_HEAD_COMPACT } from "@/lib/layout";

function getInitials(name) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function StarRating({ rating = 5, size = 11 }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <FaStar
          key={i}
          size={size}
          className={i < rating ? "text-[#C89B3C]" : "text-gray-200"}
        />
      ))}
    </div>
  );
}

function TestimonialTab({ testimonial, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`group relative flex shrink-0 items-center gap-1.5 overflow-hidden rounded-md border px-2 py-1.5 text-left transition sm:gap-2 sm:px-2.5 sm:py-2 ${
        active
          ? "border-[#082F63] bg-white shadow-sm ring-1 ring-[#C89B3C]/30"
          : "border-[#e8e4dc] bg-white/60 hover:border-[#C89B3C]/40 hover:bg-white"
      }`}
    >
      {active && (
        <span className="absolute inset-x-0 top-0 h-0.5 bg-[#C89B3C]" aria-hidden />
      )}
      <div
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white sm:h-7 sm:w-7 sm:text-[10px] ${
          active ? "bg-[#082F63]" : "bg-[#082F63]/80 group-hover:bg-[#082F63]"
        }`}
      >
        {getInitials(testimonial.name)}
      </div>
      <span className="whitespace-nowrap text-[11px] font-semibold text-[#082F63]">
        {testimonial.name.split(" ")[0]}
      </span>
    </button>
  );
}

function TestimonialCard({ testimonial }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#e8e4dc] bg-white shadow-[0_2px_16px_rgba(8,47,99,0.06)]">
      <div className="px-5 py-5 sm:px-6 sm:py-5 lg:px-7">
        <FaQuoteLeft className="mb-2.5 text-[#C89B3C]" size={14} />
        <blockquote className="font-heading text-[15px] italic leading-[1.7] text-[#333] sm:text-[16px]">
          &ldquo;{testimonial.quote}&rdquo;
        </blockquote>
        <div className="mt-4 flex items-center justify-between gap-4">
          <StarRating rating={testimonial.rating ?? 5} />
          <p className="font-signature shrink-0 text-[26px] leading-none text-[#082F63] sm:text-[30px] lg:text-[34px]">
            {testimonial.name}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Testimonials() {
  const { testimonials, testimonialsSection } = useSiteData();
  const [index, setIndex] = useState(0);

  const goTo = useCallback(
    (next) => {
      setIndex(
        ((next % testimonials.length) + testimonials.length) % testimonials.length
      );
    },
    [testimonials.length]
  );

  useEffect(() => {
    const timer = setInterval(() => goTo(index + 1), 8000);
    return () => clearInterval(timer);
  }, [index, goTo]);

  return (
    <section className={SECTION_CREAM}>
      <div className={CONTAINER}>
        <div className={SECTION_HEAD_COMPACT}>
          <SectionHeading
            label={testimonialsSection.label}
            title={testimonialsSection.title}
            subtitle={testimonialsSection.subtitle}
            align="left"
            className="mb-0"
          />
        </div>

        <div className="w-full">
          <div className="flex w-full items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              aria-label="Previous"
              className="carousel-nav-btn hidden h-9 w-9 shrink-0 sm:flex"
            >
              <HiChevronLeft size={18} />
            </button>

            <div className="min-w-0 flex-1">
              {/* Tabs — small, left aligned with box */}
              <div className="mb-3 flex flex-wrap items-center gap-2">
                {testimonials.map((t, i) => (
                  <TestimonialTab
                    key={t.name}
                    testimonial={t}
                    active={i === index}
                    onClick={() => goTo(i)}
                  />
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                >
                  <TestimonialCard testimonial={testimonials[index]} />
                </motion.div>
              </AnimatePresence>

              <div className="mt-3 flex justify-end">
                <p className="text-[11px] text-gray-400">
                  {index + 1} / {testimonials.length}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => goTo(index + 1)}
              aria-label="Next"
              className="carousel-nav-btn hidden h-9 w-9 shrink-0 sm:flex"
            >
              <HiChevronRight size={18} />
            </button>
          </div>

          {/* Mobile nav */}
          <div className="mt-3 flex justify-center gap-3 sm:hidden">
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              aria-label="Previous"
              className="carousel-nav-btn h-9 w-9"
            >
              <HiChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              aria-label="Next"
              className="carousel-nav-btn h-9 w-9"
            >
              <HiChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
