"use client";

import LogoIcon from "@/components/ui/LogoIcon";
import { useSiteData } from "@/context/SiteDataContext";

export default function BrandLogo({
  variant = "light",
  iconClassName = "h-[75px] w-[75px]",
  className = "",
  showTagline = true,
}) {
  const { site } = useSiteData();
  const isDark = variant === "dark";

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <LogoIcon className={`${iconClassName} shrink-0`} aria-label={site.name} />
      <div className="flex flex-col min-w-0">
        <span
          className={`font-logo font-bold uppercase tracking-[0.12em] leading-[0.95]
      text-[18px] sm:text-[22px] lg:text-[26px]
      ${isDark ? "text-white" : "text-[#082F63]"}`}
        >
          SHREE SHYAM
        </span>
        <span
          className={`font-logo font-bold uppercase tracking-[0.12em] leading-[0.95]
      text-[18px] sm:text-[22px] lg:text-[26px]
      ${isDark ? "text-white" : "text-[#082F63]"}`}
        >
          DAIRY FARM
        </span>
        {showTagline && (
          <span
            className={`font-tagline mt-1 text-[13px] sm:text-[14px]
        font-medium tracking-[0.02em] leading-snug
        ${isDark ? "text-white/70" : "text-[#4A5568]"}`}
          >
            {site.logoTagline}
          </span>
        )}
      </div>
    </div>
  );
}
