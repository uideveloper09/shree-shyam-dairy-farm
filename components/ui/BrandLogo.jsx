"use client";

import LogoIcon from "@/components/ui/LogoIcon";
import { useSiteData } from "@/context/SiteDataContext";

export default function BrandLogo({
  variant = "light",
  iconClassName,
  className = "",
  showTagline = true,
  compact = false,
  stacked: stackedProp,
}) {
  const { site } = useSiteData();
  const isDark = variant === "dark";
  const stacked = stackedProp ?? compact;

  const resolvedIconClass =
    iconClassName ??
    (compact
      ? "h-10 w-10 sm:h-11 sm:w-11 lg:h-[46px] lg:w-[46px]"
      : stacked
        ? "h-11 w-11 sm:h-12 sm:w-12 lg:h-[56px] lg:w-[56px]"
        : "h-[52px] w-[52px] lg:h-[52px] lg:w-[52px]");

  const titleSize = compact
    ? "text-[11px] sm:text-[13px] lg:text-[17px]"
    : stacked
      ? "text-[13px] sm:text-[16px] lg:text-[20px]"
      : "text-[16px] sm:text-[17px] lg:text-[20px]";

  const subtitleSize = compact
    ? "text-[9px] sm:text-[11px] lg:text-[14px]"
    : stacked
      ? "text-[11px] sm:text-[14px] lg:text-[17px]"
      : "text-[14px] sm:text-[15px] lg:text-[17px]";

  const taglineSize = compact
    ? "text-[9px] sm:text-[10px] lg:text-[11px]"
    : "text-[10px] sm:text-[12px] lg:text-[13px]";

  const titleClass = isDark ? "logo-wordmark-title-dark" : "logo-wordmark-title-light";
  const frameClass = compact ? "logo-wordmark-frame logo-wordmark-frame-compact" : "logo-wordmark-frame";

  return (
    <div
      className={`flex w-full min-w-0 items-center ${compact ? "gap-1.5 py-0.5 sm:gap-2.5 sm:py-0.5 lg:gap-2.5" : "gap-2 py-0.5 sm:gap-3 sm:py-1 lg:gap-3"} ${className}`}
    >
      <LogoIcon className={resolvedIconClass} aria-label={site.name} />
      <div className="min-w-0 overflow-hidden">
        {stacked ? (
          <div className={`${frameClass} min-w-0`}>
            <span
              className={`logo-wordmark ${titleClass} block max-w-full leading-[1.05] ${compact ? "truncate" : ""} ${titleSize}`}
            >
              SHREE SHYAM
            </span>
            <div className="logo-wordmark-rule max-w-full" aria-hidden>
              <span className="logo-wordmark-rule-line shrink" />
              <span className="logo-wordmark-rule-gem" />
              <span className="logo-wordmark-rule-line shrink" />
            </div>
            <span
              className={`logo-wordmark logo-wordmark-subtitle block max-w-full leading-[1.05] ${compact ? "truncate" : ""} ${subtitleSize}`}
            >
              DAIRY FARM
            </span>
          </div>
        ) : (
          <>
            <span
              className={`logo-wordmark block max-w-full truncate leading-[1.05] ${titleSize} ${
                isDark ? "text-white" : "text-[#082F63]"
              }`}
            >
              SHREE SHYAM
            </span>
            <span
              className={`logo-wordmark block max-w-full truncate leading-[1.05] ${subtitleSize} ${
                isDark ? "text-[#C89B3C]" : "text-[#082F63]"
              }`}
            >
              DAIRY FARM
            </span>
          </>
        )}
        {showTagline && (
          <span
            className={`font-tagline mt-0.5 font-medium leading-tight tracking-[0.02em] text-[#C89B3C] sm:mt-1 sm:tracking-[0.03em] ${
              compact ? "hidden truncate sm:block" : "break-words leading-snug"
            } ${taglineSize}`}
          >
            {site.hindiTagline}
          </span>
        )}
      </div>
    </div>
  );
}
