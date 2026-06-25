"use client";

import Image from "next/image";
import { FaLeaf, FaTruck, FaAward } from "react-icons/fa";
import { useSiteData } from "@/context/SiteDataContext";
import SectionLink from "@/components/ui/SectionLink";
import { CONTAINER } from "@/lib/layout";

const TRUST_ITEMS = [
  { icon: FaLeaf, label: "100% Natural" },
  { icon: FaTruck, label: "Farm to Home" },
  { icon: FaAward, label: "Premium Quality" },
];

export default function AnmasaHero() {
  const { site, hero } = useSiteData();

  return (
    <section id="home" className="relative w-full overflow-hidden bg-[#061E3D]">
      <div className="relative min-h-[420px] sm:min-h-[540px] lg:min-h-[620px]">
        <Image
          src={hero.image}
          alt={hero.imageAlt || site.name}
          fill
          priority
          className="object-cover object-center scale-105"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#061E3D]/92 via-[#082F63]/55 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#061E3D]/40 via-transparent to-transparent" />

        <div
          className={`${CONTAINER} relative z-10 flex min-h-[420px] items-center sm:min-h-[540px] lg:min-h-[620px]`}
        >
          <div className="max-w-2xl py-5 sm:py-8 lg:py-10">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#C89B3C]/40 bg-[#C89B3C]/10 px-3 py-1 backdrop-blur-sm sm:mb-5 sm:px-4 sm:py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#C89B3C]" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#C89B3C] sm:text-[11px] sm:tracking-[0.22em]">
                {hero.eyebrow}
              </p>
            </div>

            <h1 className="font-heading text-[1.75rem] font-bold leading-[1.12] text-white sm:text-[3rem] lg:text-[3.5rem]">
              {hero.title}
            </h1>

            <p className="mt-4 max-w-lg text-[14px] leading-[1.75] text-white/75 sm:mt-5 sm:text-[16px] sm:leading-[1.85]">
              {hero.subtitle}
            </p>

            <p className="mt-2 font-tagline text-base text-[#C89B3C]/90 sm:mt-3 sm:text-xl">
              {site.hindiTagline}
            </p>

            <div className="mt-7 flex flex-col gap-2.5 sm:mt-9 sm:flex-row sm:flex-wrap sm:gap-3">
              <SectionLink
                href={hero.primaryCta.href}
                className="btn-premium-gold h-11 w-full sm:h-12 sm:w-auto sm:px-8"
              >
                {hero.primaryCta.label}
              </SectionLink>
              <SectionLink
                href={hero.secondaryCta.href}
                className="btn-premium-outline h-11 w-full sm:h-12 sm:w-auto sm:px-8"
              >
                {hero.secondaryCta.label}
              </SectionLink>
            </div>

            <div className="mt-8 flex flex-wrap gap-4 border-t border-white/10 pt-6 sm:mt-10 sm:gap-6 sm:pt-8">
              {TRUST_ITEMS.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-[#C89B3C] ring-1 ring-white/15">
                    <Icon size={14} />
                  </div>
                  <span className="text-[13px] font-medium text-white/80">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
