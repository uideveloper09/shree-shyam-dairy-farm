/**
 * SectionHeading — gold label + line + diamond + serif title
 * Used consistently across every section (Our Farm style).
 */
export default function SectionHeading({
  label,
  title,
  subtitle,
  align = "left",
  variant = "light",
  className = "",
}) {
  const isCenter = align === "center";
  const isDark = variant === "dark";

  return (
    <div
      className={`${isCenter ? "mx-auto text-center" : "text-left"} max-w-4xl ${className}`}
    >
      {label && (
        <div className={`flex items-center gap-2.5 ${isCenter ? "justify-center" : ""}`}>
          {isCenter && (
            <span className="h-px w-12 bg-[#C89B3C]/60 lg:w-16" aria-hidden />
          )}
          {isCenter && (
            <span className="text-[6px] text-[#C89B3C]" aria-hidden>
              ◆
            </span>
          )}

          <span className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.22em] text-[#C89B3C]">
            {label}
          </span>

          {isCenter ? (
            <>
              <span className="text-[6px] text-[#C89B3C]" aria-hidden>
                ◆
              </span>
              <span className="h-px w-12 bg-[#C89B3C]/60 lg:w-16" aria-hidden />
            </>
          ) : (
            <>
              <span className="h-px w-10 bg-[#C89B3C]/60 sm:w-14" aria-hidden />
              <span className="text-[6px] text-[#C89B3C]" aria-hidden>
                ◆
              </span>
            </>
          )}
        </div>
      )}

      <h2
        className={`mt-4 font-heading text-[1.875rem] font-bold leading-[1.2] sm:text-[2.25rem] lg:text-[2.625rem] ${
          isDark ? "text-white" : "text-[#082F63]"
        }`}
      >
        {title}
      </h2>

      {subtitle && (
        <p
          className={`mt-4 text-[15px] leading-[1.8] sm:text-base ${
            isDark ? "text-white/65" : "text-gray-500"
          }`}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
