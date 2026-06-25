"use client";

import { useSiteData } from "@/context/SiteDataContext";
import { CONTAINER } from "@/lib/layout";

export default function PromoBanner() {
  const { site } = useSiteData();

  return (
    <div className="bg-[#082F63]">
      <div className={CONTAINER}>
        <div className="flex flex-col items-center justify-center gap-1 px-1 py-2 text-center sm:flex-row sm:gap-6 sm:py-2.5">
          <p className="max-w-full truncate text-[11px] font-medium tracking-wide text-white/75 sm:max-w-none sm:text-[13px]">
            {site.deliveryNote}
          </p>
          <span className="hidden h-3 w-px shrink-0 bg-[#C89B3C]/40 sm:block" aria-hidden />
          <p className="max-w-full truncate text-[11px] font-semibold text-[#C89B3C] sm:max-w-none sm:text-[13px]">
            {site.promo}
          </p>
        </div>
      </div>
    </div>
  );
}
