"use client";

import Image from "next/image";

export default function LogoIcon({ className = "h-[75px] w-[75px]", "aria-label": ariaLabel }) {
  return (
    <Image
      src="/logos/logo-header.png"
      alt={ariaLabel || "Shree Shyam Dairy Farm logo"}
      width={75}
      height={75}
      sizes="(max-width: 640px) 40px, (max-width: 1024px) 48px, 56px"
      className={`block shrink-0 object-contain ${className}`}
      priority
    />
  );
}
