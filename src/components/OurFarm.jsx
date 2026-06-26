"use client";

import LazyImage from "@/components/ui/LazyImage";
import MotionReveal from "@/components/ui/MotionReveal";
import SectionHeading from "@/components/ui/SectionHeading";
import SectionLink from "@/components/ui/SectionLink";
import { useSiteData } from "@/features/cart/context/SiteDataContext";
import { HOME_SECTIONS, sectionTarget } from "@/utils/sections";
import { CONTAINER, SECTION_WHITE } from "@/constants/layout";

export default function OurFarm() {
  const { farm } = useSiteData();

  return (
    <section id={HOME_SECTIONS.FARM} className={SECTION_WHITE}>
      <div className={CONTAINER}>
        <div className="grid items-center gap-6 lg:grid-cols-2 lg:gap-10">
          <MotionReveal delay={0.1}>
            <div>
              <SectionHeading label={farm.label} title={farm.title} align="left" />
              <p className="mt-6 text-[16px] leading-[1.85] text-gray-600">{farm.description}</p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {farm.features.map((item) => (
                  <div
                    key={item}
                    className="premium-card flex items-center gap-2 rounded-xl px-4 py-3.5"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#C89B3C]/15 text-[11px] font-bold text-[#C89B3C]">
                      ✓
                    </span>
                    <span className="text-[14px] font-semibold text-[#082F63]">{item}</span>
                  </div>
                ))}
              </div>

              <SectionLink
                href={sectionTarget(HOME_SECTIONS.CONTACT)}
                className="btn-premium-navy mt-8 h-12 px-8"
              >
                {farm.cta.label}
              </SectionLink>
            </div>
          </MotionReveal>

          <MotionReveal delay={0.2}>
            <div className="relative">
              <div className="absolute -inset-3 rounded-3xl bg-gradient-to-tr from-[#082F63]/10 to-[#C89B3C]/15" />
              <div className="relative overflow-hidden rounded-3xl shadow-[0_20px_56px_rgba(8,47,99,0.12)] ring-1 ring-[#eee]">
                <LazyImage
                  src={farm.image}
                  alt={farm.imageAlt}
                  width={700}
                  height={500}
                  className="h-auto w-full object-cover"
                />
              </div>
            </div>
          </MotionReveal>
        </div>
      </div>
    </section>
  );
}
