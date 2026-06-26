"use client";

import Image from "next/image";

export const PAYMENT_LOGO_SRC = {
  upi: "/icons/payments/upi.png",
  gpay: "/icons/payments/googlepay.svg",
  phonepe: "/icons/payments/phonepe.png",
  paytm: "/icons/payments/paytm.svg",
  card: "/icons/payments/card.svg",
};

const SIZE_MAP = {
  xs: 28,
  sm: 36,
  md: 44,
  lg: 56,
};

const UPI_SIZE_MAP = {
  xs: { width: 40, height: 22 },
  sm: { width: 52, height: 28 },
  md: { width: 64, height: 34 },
  lg: { width: 80, height: 42 },
};

const LOGO_IMAGE_CLASS = {
  upi: "h-full w-full object-contain px-0.5 py-0",
  phonepe: "box-border h-full w-full object-contain px-2 py-1",
  default: "h-full w-full object-contain p-0.5",
};

export function PaymentMethodLogo({ id, size = "sm", active = false, brandColor, className = "" }) {
  const src = PAYMENT_LOGO_SRC[id];
  if (!src) return null;

  const isUpi = id === "upi";
  const square = SIZE_MAP[size] || SIZE_MAP.sm;
  const upiSize = UPI_SIZE_MAP[size] || UPI_SIZE_MAP.sm;
  const width = isUpi ? upiSize.width : square;
  const height = isUpi ? upiSize.height : square;

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white ring-1 ring-black/[0.06] ${className}`}
      style={{
        width,
        height,
        ...(active && brandColor ? { boxShadow: `0 0 0 1px ${brandColor}33` } : {}),
      }}
    >
      <Image
        src={src}
        alt=""
        width={width}
        height={height}
        className={LOGO_IMAGE_CLASS[id] || LOGO_IMAGE_CLASS.default}
        unoptimized
      />
    </span>
  );
}
