import Image from "next/image";

export default function LogoIcon({ className = "h-[75px] w-[75px]", "aria-label": ariaLabel, ...props }) {
  return (
    <span
      className={`relative inline-block shrink-0 ${className}`}
      aria-label={ariaLabel}
      role={ariaLabel ? "img" : undefined}
    >
      <Image
        src="/logos/logo-header.png"
        alt={ariaLabel || "Shree Shyam Dairy Farm logo"}
        fill
        sizes="(max-width: 640px) 40px, (max-width: 1024px) 48px, 56px"
        className="object-contain"
        priority
        {...props}
      />
    </span>
  );
}
