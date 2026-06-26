"use client";

import Image from "next/image";
import { Loader2, Smartphone } from "lucide-react";
import { PaymentMethodLogo } from "@/components/ui/PaymentMethodIcons";
import { PAYMENT_METHOD_META } from "@/utils/paymentMethods";
import { formatINR } from "@/utils/cart";

function ScanLine() {
  return (
    <div className="pointer-events-none absolute inset-x-3 top-0 h-full overflow-hidden rounded-xl">
      <div className="payment-scan-line absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#C89B3C] to-transparent opacity-80" />
    </div>
  );
}

export default function PaymentScannerPanel({
  methodId,
  amount,
  qrImageUrl,
  qrLoading,
  qrError,
  isMobile,
  onOpenApp,
  openLoading,
}) {
  const meta = PAYMENT_METHOD_META[methodId] || PAYMENT_METHOD_META.upi;

  if (methodId === "card") {
    return (
      <div className={`rounded-2xl border p-5 ${meta.frame}`}>
        <div className="flex flex-col items-center text-center">
          <PaymentMethodLogo id="card" size="md" active />
          <p className="mt-3 text-[15px] font-semibold text-[#082F63]">Secure card payment</p>
          <p className="mt-1 max-w-[240px] text-[12px] leading-relaxed text-gray-500">
            Visa, Mastercard & RuPay — encrypted checkout via Razorpay
          </p>
          <div className="mt-4 flex gap-2">
            {["VISA", "MC", "RuPay"].map((label) => (
              <span
                key={label}
                className="rounded-md bg-white px-2.5 py-1 text-[10px] font-bold tracking-wide text-[#082F63]/70 ring-1 ring-[#e8e4dc]"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border p-4 sm:p-5 ${meta.frame}`}>
      <div className="flex items-center gap-3 border-b border-[#e8e4dc]/80 pb-3">
        <PaymentMethodLogo id={methodId} size="md" active />
        <div>
          <p className="text-[14px] font-semibold text-[#082F63]">{meta.scanLabel}</p>
          <p className="text-[11px] text-gray-500">Amount: {formatINR(amount)}</p>
        </div>
      </div>

      <div className="relative mx-auto mt-4 w-fit">
        <div className="relative overflow-hidden rounded-2xl bg-white p-3 shadow-[0_8px_32px_rgba(8,47,99,0.1)] ring-2 ring-[#C89B3C]/30">
          {qrLoading ? (
            <div className="flex h-[200px] w-[200px] items-center justify-center">
              <Loader2 size={32} className="animate-spin text-[#082F63]/30" />
            </div>
          ) : qrImageUrl ? (
            <>
              <ScanLine />
              <Image
                src={qrImageUrl}
                alt={`${meta.label} payment QR code`}
                width={200}
                height={200}
                unoptimized
                className="relative h-[200px] w-[200px] object-contain"
              />
            </>
          ) : (
            <div className="flex h-[200px] w-[200px] flex-col items-center justify-center gap-2 px-4 text-center">
              <p className="text-[11px] leading-relaxed text-gray-500">
                {qrError || "QR could not be loaded"}
              </p>
            </div>
          )}
        </div>
        <span
          className="absolute -left-1 -top-1 h-5 w-5 rounded-tl-lg border-l-2 border-t-2"
          style={{ borderColor: meta.scanColor }}
        />
        <span
          className="absolute -right-1 -top-1 h-5 w-5 rounded-tr-lg border-r-2 border-t-2"
          style={{ borderColor: meta.scanColor }}
        />
        <span
          className="absolute -bottom-1 -left-1 h-5 w-5 rounded-bl-lg border-b-2 border-l-2"
          style={{ borderColor: meta.scanColor }}
        />
        <span
          className="absolute -bottom-1 -right-1 h-5 w-5 rounded-br-lg border-b-2 border-r-2"
          style={{ borderColor: meta.scanColor }}
        />
      </div>

      <p className="mt-4 text-center text-[12px] leading-relaxed text-gray-500">
        {isMobile
          ? `Scan QR with ${meta.label} or tap below to open the app`
          : `Open ${meta.label} on your phone and scan this QR`}
      </p>

      {isMobile && (
        <button
          type="button"
          onClick={onOpenApp}
          disabled={openLoading || qrLoading}
          className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#082F63]/15 bg-white text-[13px] font-semibold text-[#082F63] shadow-sm transition hover:border-[#C89B3C]/40 hover:shadow-md disabled:opacity-50"
        >
          {openLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Smartphone size={16} className="text-[#C89B3C]" />
          )}
          {meta.openLabel}
        </button>
      )}
    </div>
  );
}
