"use client";

import { Lock } from "lucide-react";
import { PaymentMethodLogo } from "@/components/ui/PaymentMethodIcons";
import { PAYMENT_METHOD_META } from "@/utils/paymentMethods";
import { formatINR } from "@/utils/cart";

const UPI_APP_LABELS = ["GPay", "PhonePe", "Paytm", "BHIM"];

export default function PaymentScannerPanel({ methodId, amount, isMobile }) {
  const meta = PAYMENT_METHOD_META[methodId] || PAYMENT_METHOD_META.upi;

  if (methodId === "card") {
    return (
      <div className={`rounded-2xl border p-5 ${meta.frame}`}>
        <div className="flex flex-col items-center text-center">
          <PaymentMethodLogo id="card" size="md" active />
          <p className="mt-3 text-[15px] font-semibold text-[#082F63]">Secure card payment</p>
          <p className="mt-1 max-w-[260px] text-[12px] leading-relaxed text-gray-500">
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
          <p className="text-[14px] font-semibold text-[#082F63]">{meta.label} via Razorpay</p>
          <p className="text-[11px] text-gray-500">Amount: {formatINR(amount)}</p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-white p-5 text-center shadow-[0_8px_32px_rgba(8,47,99,0.08)] ring-2 ring-[#C89B3C]/25">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#082F63]/5">
          <Lock size={28} className="text-[#082F63]" strokeWidth={1.75} />
        </div>
        <p className="mt-3 text-[14px] font-semibold text-[#082F63]">Secure Razorpay checkout</p>
        <p className="mt-1.5 text-[12px] leading-relaxed text-gray-500">
          Neeche Pay dabayein — Razorpay popup mein UPI QR, GPay, PhonePe aur Paytm milega.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {UPI_APP_LABELS.map((label) => (
            <span
              key={label}
              className="rounded-full bg-[#faf9f6] px-2.5 py-1 text-[10px] font-semibold text-[#082F63]/75 ring-1 ring-[#e8e4dc]"
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      <p className="mt-4 text-center text-[12px] leading-relaxed text-gray-500">
        {isMobile
          ? "Neeche Pay dabayein — Razorpay checkout khulega"
          : "Neeche Pay dabayein — Razorpay checkout mein QR scan karein"}
      </p>
    </div>
  );
}
