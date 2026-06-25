"use client";

import { FaMapMarkerAlt, FaPhoneAlt } from "react-icons/fa";
import { useSiteData } from "@/context/SiteDataContext";
import { CONTAINER } from "@/lib/layout";

export default function TopBar() {
  const { site } = useSiteData();

  return (
    <div className="border-b border-[#eee] bg-[#faf9f6]">
      <div className={CONTAINER}>
        <div className="flex h-8 items-center justify-end gap-3 text-[11px] text-gray-600 sm:h-9 sm:justify-between sm:gap-4 sm:text-[12px]">
          <p className="hidden truncate font-medium sm:block">{site.serviceNote}</p>
          <div className="flex min-w-0 items-center gap-3 sm:gap-5">
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(site.location)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden min-w-0 items-center gap-1.5 truncate transition hover:text-[#082F63] md:flex"
            >
              <FaMapMarkerAlt size={10} className="shrink-0 text-[#C89B3C]" />
              <span className="truncate">{site.location}</span>
            </a>
            <a
              href={`tel:${site.phone.replace(/\s/g, "")}`}
              className="flex min-w-0 items-center gap-1.5 font-medium transition hover:text-[#082F63]"
            >
              <FaPhoneAlt size={10} className="shrink-0 text-[#C89B3C]" />
              <span className="truncate">{site.phone}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
