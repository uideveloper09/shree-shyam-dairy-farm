"use client";

import LogoIcon from "@/components/ui/LogoIcon";
import { useSiteData } from "@/context/SiteDataContext";

export default function BrandLogo({
  variant = "light",
  iconClassName,
  className = "",
  showTagline = true,
  compact = false,
}) {
  const { site } = useSiteData();
  const isDark = variant === "dark";

  const resolvedIconClass =
    iconClassName ??
    (compact ? "h-10 w-10 sm:h-12 sm:w-12 lg:h-[75px] lg:w-[75px]" : "h-[75px] w-[75px]");

  return (
    <div className={`flex items-center gap-2 sm:gap-3 ${className}`}>
      <LogoIcon className={`${resolvedIconClass} shrink-0`} aria-label={site.name} />
      <div className="flex min-w-0 flex-col">
        <span
          className={`font-logo font-bold uppercase leading-[0.95] tracking-[0.1em] sm:tracking-[0.12em]
      ${compact ? "text-[13px] sm:text-[18px] lg:text-[26px]" : "text-[18px] sm:text-[22px] lg:text-[26px]"}
      ${isDark ? "text-white" : "text-[#082F63]"}`}
        >
          SHREE SHYAM
        </span>
        <span
          className={`font-logo font-bold uppercase leading-[0.95] tracking-[0.1em] sm:tracking-[0.12em]
      ${compact ? "text-[13px] sm:text-[18px] lg:text-[26px]" : "text-[18px] sm:text-[22px] lg:text-[26px]"}
      ${isDark ? "text-white" : "text-[#082F63]"}`}
        >
          DAIRY FARM
        </span>
        {showTagline && (
          <span
            className={`font-tagline mt-0.5 font-medium leading-snug tracking-[0.02em]
        ${compact ? "hidden text-[11px] sm:mt-1 sm:block sm:text-[13px] lg:text-[14px]" : "mt-1 text-[13px] sm:text-[14px]"}
        ${isDark ? "text-white/70" : "text-[#4A5568]"}`}
          >
            {site.logoTagline}
          </span>
        )}
      </div>
    </div>
  );
}
