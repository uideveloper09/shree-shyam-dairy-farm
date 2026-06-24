"use client";

import { FaMapMarkerAlt, FaPhoneAlt } from "react-icons/fa";
import { useSiteData } from "@/context/SiteDataContext";
import { CONTAINER } from "@/lib/layout";

export default function TopBar() {
  const { site } = useSiteData();

  return (
    <div className="border-b border-[#eee] bg-[#faf9f6]">
      <div className={CONTAINER}>
        <div className="flex h-9 items-center justify-between gap-4 text-[12px] text-gray-600">
          <p className="hidden truncate font-medium sm:block">{site.serviceNote}</p>
          <div className="ml-auto flex items-center gap-5">
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(site.location)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-1.5 transition hover:text-[#082F63] md:flex"
            >
              <FaMapMarkerAlt size={10} className="text-[#C89B3C]" />
              {site.location}
            </a>
            <a
              href={`tel:${site.phone.replace(/\s/g, "")}`}
              className="flex items-center gap-1.5 font-medium transition hover:text-[#082F63]"
            >
              <FaPhoneAlt size={10} className="text-[#C89B3C]" />
              {site.phone}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
