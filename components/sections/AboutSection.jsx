"use client";

import Image from "next/image";
import SectionHeading from "@/components/ui/SectionHeading";
import SectionLink from "@/components/ui/SectionLink";
import { useSiteData } from "@/context/SiteDataContext";
import { HOME_SECTIONS, sectionTarget } from "@/lib/sections";
import { CONTAINER, SECTION_CREAM } from "@/lib/layout";

/**
 * About section — must keep id={HOME_SECTIONS.ABOUT} for scroll targeting.
 * Reuse this pattern for Services, FAQ, etc.: export a constant id + SectionLink targets.
 */
export default function AboutSection() {
  const { site, about } = useSiteData();

  return (
    <section id={HOME_SECTIONS.ABOUT} className={SECTION_CREAM}>
      <div className={CONTAINER}>
        <div className="grid items-center gap-6 lg:grid-cols-2 lg:gap-10">
          <div className="relative w-full">
            <div className="absolute -inset-3 rounded-2xl bg-gradient-to-br from-[#C89B3C]/20 to-[#082F63]/10" />
            <div className="relative overflow-hidden rounded-2xl bg-[#f3f1ec] shadow-[0_16px_48px_rgba(8,47,99,0.15)] ring-1 ring-white/80">
              <Image
                src={about.image}
                alt={about.imageAlt}
                width={1920}
                height={1080}
                className="h-auto w-full object-contain"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>

          <div>
            <SectionHeading
              label={about.label}
              title={about.title}
              align="left"
              className="mb-6"
            />
            <p className="text-[16px] leading-[1.85] text-gray-600">
              {site.description} {about.body}
            </p>
            <p className="mt-5 font-tagline text-xl text-[#C89B3C]">{site.hindiTagline}</p>
            <SectionLink
              href={sectionTarget(HOME_SECTIONS.FARM)}
              className="btn-premium-navy mt-8 h-12 px-8"
            >
              {about.cta.label}
            </SectionLink>
          </div>
        </div>
      </div>
    </section>
  );
}
