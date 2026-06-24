/**
 * SectionHeading — pixel-perfect
 * ────────────────────────────────
 * Label  : 11px gold, uppercase, tracking-[0.22em], decorative lines + diamond
 * H2     : 52px desktop  (Playfair, 700, #082F63)
 * Sub    : 16px Poppins, gray-500, line-height 1.8
 */
export default function SectionHeading({ label, title, subtitle, align = "center" }) {
  const isCenter = align === "center";

  return (
    <div className={`${isCenter ? "text-center mx-auto" : "text-left"} max-w-4xl`}>

      {/* Label row */}
      {label && (
        <div className={`flex items-center gap-2.5 ${isCenter ? "justify-center" : ""}`}>
          {isCenter && <span className="h-px w-12 lg:w-16 bg-[#C89B3C]/60" />}
          {isCenter && <span className="text-[6px] text-[#C89B3C]">◆</span>}

          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#C89B3C] whitespace-nowrap">
            {label}
          </span>

          {isCenter ? (
            <>
              <span className="text-[6px] text-[#C89B3C]">◆</span>
              <span className="h-px w-12 lg:w-16 bg-[#C89B3C]/60" />
            </>
          ) : (
            <>
              <span className="h-px w-10 sm:w-14 bg-[#C89B3C]/60" />
              <span className="text-[6px] text-[#C89B3C]">◆</span>
            </>
          )}
        </div>
      )}

      {/* H2 — 52px desktop, responsive scale down */}
      <h2 className="
        mt-4 font-heading font-bold text-[#082F63] leading-[1.2]
        text-[1.875rem] sm:text-[2.25rem] lg:text-[3.25rem]
      ">
        {title}
      </h2>

      {/* Optional subtitle */}
      {subtitle && (
        <p className="mt-4 text-[15px] sm:text-base text-gray-500 leading-[1.8]">
          {subtitle}
        </p>
      )}
    </div>
  );
}
