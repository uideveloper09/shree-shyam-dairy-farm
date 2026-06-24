"use client";

import Image from "next/image";
import { FaLeaf, FaTruck, FaAward } from "react-icons/fa";
import { useSiteData } from "@/context/SiteDataContext";
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
      <div className="relative min-h-[480px] sm:min-h-[540px] lg:min-h-[620px]">
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
          className={`${CONTAINER} relative z-10 flex min-h-[480px] items-center sm:min-h-[540px] lg:min-h-[620px]`}
        >
          <div className="max-w-2xl py-16 lg:py-20">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#C89B3C]/40 bg-[#C89B3C]/10 px-4 py-1.5 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-[#C89B3C]" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#C89B3C]">
                {hero.eyebrow}
              </p>
            </div>

            <h1 className="font-heading text-[2.25rem] font-bold leading-[1.08] text-white sm:text-[3rem] lg:text-[3.5rem]">
              {hero.title}
            </h1>

            <p className="mt-5 max-w-lg text-[16px] leading-[1.85] text-white/75">
              {hero.subtitle}
            </p>

            <p className="mt-3 font-tagline text-lg text-[#C89B3C]/90 sm:text-xl">
              {site.hindiTagline}
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <a
                href={hero.primaryCta.href}
                className="btn-premium-gold h-12 px-8"
              >
                {hero.primaryCta.label}
              </a>
              <a
                href={hero.secondaryCta.href}
                className="btn-premium-outline h-12 px-8"
              >
                {hero.secondaryCta.label}
              </a>
            </div>

            <div className="mt-10 flex flex-wrap gap-6 border-t border-white/10 pt-8">
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
