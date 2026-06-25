"use client";

import { useRef, useState, useEffect } from "react";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi";
import { FaShieldAlt, FaLeaf, FaHome } from "react-icons/fa";
import { FaCow } from "react-icons/fa6";
import SectionHeading from "@/components/ui/SectionHeading";
import { useSiteData } from "@/context/SiteDataContext";
import { CONTAINER, SECTION_CREAM, SECTION_HEAD_ALT } from "@/lib/layout";

const ICON_MAP = {
  shield: FaShieldAlt,
  leaf: FaLeaf,
  cow: FaCow,
  home: FaHome,
};

function ValueCard({ item }) {
  const Icon = ICON_MAP[item.icon];
  return (
    <div className="w-full shrink-0 snap-center px-2 sm:px-4">
      <div className="premium-card relative mx-auto max-w-sm overflow-hidden p-8 text-center">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#C89B3C] via-[#d4ab5a] to-[#C89B3C]" />
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#082F63]/8 text-[#082F63] ring-2 ring-[#C89B3C]/20">
          <Icon size={26} />
        </div>
        <h3 className="mt-5 font-heading text-xl font-bold text-[#082F63]">{item.title}</h3>
        <p className="mt-3 text-[14px] leading-relaxed text-gray-500">{item.desc}</p>
      </div>
    </div>
  );
}

export default function WhyAnmasa() {
  const { whyChoose, whySection } = useSiteData();
  const scrollRef = useRef(null);
  const [index, setIndex] = useState(0);

  const scrollTo = (i) => {
    const el = scrollRef.current;
    if (!el) return;
    const clamped = ((i % whyChoose.length) + whyChoose.length) % whyChoose.length;
    setIndex(clamped);
    el.scrollTo({ left: clamped * el.clientWidth, behavior: "smooth" });
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setIndex(Math.round(el.scrollLeft / el.clientWidth));
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [whyChoose.length]);

  return (
    <section id="quality" className={SECTION_CREAM}>
      <div className={CONTAINER}>
        <div className={SECTION_HEAD_ALT}>
          <SectionHeading
            label={whySection.label}
            title={whySection.title}
            align="left"
            className="mb-0"
          />
        </div>

        <div className="relative px-1 lg:hidden">
          <button
            type="button"
            onClick={() => scrollTo(index - 1)}
            aria-label="Previous"
            className="carousel-nav-btn absolute left-0 top-1/2 z-10 -translate-y-1/2"
          >
            <HiChevronLeft size={18} />
          </button>
          <div
            ref={scrollRef}
            className="carousel-track flex snap-x snap-mandatory overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {whyChoose.map((item) => (
              <ValueCard key={item.title} item={item} />
            ))}
          </div>
          <button
            type="button"
            onClick={() => scrollTo(index + 1)}
            aria-label="Next"
            className="carousel-nav-btn absolute right-0 top-1/2 z-10 -translate-y-1/2"
          >
            <HiChevronRight size={18} />
          </button>
        </div>

        <div className="hidden gap-6 lg:grid lg:grid-cols-4">
          {whyChoose.map((item) => {
            const Icon = ICON_MAP[item.icon];
            return (
              <div key={item.title} className="premium-card relative overflow-hidden p-7 text-center">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#C89B3C] via-[#d4ab5a] to-[#C89B3C]" />
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#082F63]/8 text-[#082F63] ring-2 ring-[#C89B3C]/20">
                  <Icon size={26} />
                </div>
                <h3 className="mt-5 font-heading text-lg font-bold text-[#082F63]">
                  {item.title}
                </h3>
                <p className="mt-2 text-[14px] leading-relaxed text-gray-500">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
