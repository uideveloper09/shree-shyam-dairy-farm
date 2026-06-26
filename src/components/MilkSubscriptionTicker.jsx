"use client";

import { Milk } from "lucide-react";
import { useSectionScroll } from "@/features/cart/context/SectionScrollContext";
import { HOME_SECTIONS } from "@/utils/sections";

const TICKER_MESSAGES = [
  "Daily delivery",
  "Subscribe to fresh farm milk",
  "Doorstep delivery every day — pause, skip, or vacation mode anytime",
  "Auto-pay via Razorpay UPI or card",
  "Daily · Weekly · Custom",
  "Pause anytime",
  "Farm-fresh every morning",
  "Subscribe to milk",
  "No lock-in · Cancel anytime",
];

function TickerGroup({ messages, duplicate = false }) {
  return (
    <div className="milk-ticker-group" aria-hidden={duplicate || undefined}>
      {messages.map((message) => (
        <span
          key={message}
          className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap px-3 sm:gap-2.5 sm:px-4 md:px-5"
        >
          <Milk size={12} className="shrink-0 text-[#E8C56A]" aria-hidden />
          <span className="whitespace-nowrap">{message}</span>
          <span className="text-[#C89B3C]/60" aria-hidden>
            ✦
          </span>
        </span>
      ))}
    </div>
  );
}

export default function MilkSubscriptionTicker() {
  const { scrollToSection } = useSectionScroll();

  const handleClick = () => {
    scrollToSection(HOME_SECTIONS.MILK_SUBSCRIPTION);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="milk-ticker-root block w-full min-h-[34px] cursor-pointer border-b border-[#C89B3C]/25 bg-[#061e3d] py-2 text-left transition hover:bg-[#072a52] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#C89B3C] sm:min-h-[36px] sm:py-2.5"
      aria-label="Scroll to milk subscription section"
    >
      <div className="flex h-full min-h-[18px] items-center overflow-hidden sm:min-h-[20px]">
        <div className="milk-ticker-track text-[9px] font-semibold uppercase leading-none tracking-[0.08em] text-white/88 min-[380px]:text-[10px] sm:text-[11px] sm:tracking-[0.1em]">
          <TickerGroup messages={TICKER_MESSAGES} />
          <TickerGroup messages={TICKER_MESSAGES} duplicate />
        </div>
      </div>
    </button>
  );
}
