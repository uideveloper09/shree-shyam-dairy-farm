"use client";

import { useSiteData } from "@/context/SiteDataContext";
import { CONTAINER } from "@/lib/layout";

export default function PromoBanner() {
  const { site } = useSiteData();

  return (
    <div className="bg-[#082F63]">
      <div className={CONTAINER}>
        <div className="flex flex-col items-center justify-center gap-1.5 py-2.5 text-center sm:flex-row sm:gap-8">
          <p className="text-[12px] font-medium tracking-wide text-white/75 sm:text-[13px]">
            {site.deliveryNote}
          </p>
          <span className="hidden h-3 w-px bg-[#C89B3C]/40 sm:block" aria-hidden />
          <p className="text-[12px] font-semibold text-[#C89B3C] sm:text-[13px]">
            {site.promo}
          </p>
        </div>
      </div>
    </div>
  );
}
