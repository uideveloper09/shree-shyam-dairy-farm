import Image from "next/image";
import Link from "next/link";
import { Milk, Calendar, PauseCircle, ArrowRight, Sparkles } from "lucide-react";
import { CONTAINER } from "@/constants/layout";
import MotionReveal from "@/components/ui/MotionReveal";
import { HOME_SECTIONS } from "@/utils/sections";

const perks = [
  { icon: Calendar, label: "Daily · Weekly · Custom" },
  { icon: PauseCircle, label: "Pause anytime" },
  { icon: Sparkles, label: "Farm-fresh every morning" },
];

export default function MilkSubscriptionCTA() {
  return (
    <section
      id={HOME_SECTIONS.MILK_SUBSCRIPTION}
      className="relative z-10 w-full scroll-mt-[7.25rem] sm:scroll-mt-[7.5rem]"
    >
      <div className="bg-premium-navy-strip relative overflow-hidden shadow-[0_12px_40px_rgba(8,47,99,0.24)]">
        <div className="premium-grain-overlay" aria-hidden />
        <div
          className="pointer-events-none absolute -left-20 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full bg-[#C89B3C]/10 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C89B3C]/60 to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#C89B3C]/25 to-transparent"
          aria-hidden
        />

        <div className={`${CONTAINER} relative z-10 py-4 sm:py-5`}>
          <MotionReveal>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
              <div className="min-w-0 flex-1 lg:max-w-3xl">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#C89B3C]/35 bg-[#C89B3C]/10 px-2.5 py-1 backdrop-blur-sm">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#C89B3C]/20">
                    <Milk size={11} className="text-[#F3DFA8]" />
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#F3DFA8]">
                    Daily delivery
                  </span>
                </div>

                <h2 className="font-heading text-[1.25rem] font-bold leading-tight text-white sm:text-[1.45rem]">
                  Subscribe to fresh farm milk
                </h2>

                <p className="mt-1.5 max-w-xl text-[12px] leading-relaxed text-white/72 sm:text-[13px]">
                  Doorstep delivery every day — pause, skip, or vacation mode anytime. Auto-pay via
                  Razorpay UPI or card.
                </p>

                <ul className="mt-3 flex flex-wrap gap-2">
                  {perks.map(({ icon: Icon, label }) => (
                    <li
                      key={label}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/6 px-2.5 py-1 text-[10px] font-medium text-white/82 backdrop-blur-sm"
                    >
                      <Icon size={11} className="shrink-0 text-[#C89B3C]" />
                      {label}
                    </li>
                  ))}
                </ul>

                <div className="mt-3.5 flex flex-wrap items-center gap-3">
                  <Link
                    href="/login?redirect=/account/subscriptions"
                    className="group inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#C89B3C] via-[#D4AD4F] to-[#E8C56A] px-5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#082F63] shadow-[0_6px_20px_rgba(200,155,60,0.35)] ring-1 ring-[#F3DFA8]/30 transition hover:shadow-[0_8px_28px_rgba(200,155,60,0.45)]"
                  >
                    Subscribe to milk
                    <ArrowRight size={13} className="transition group-hover:translate-x-0.5" />
                  </Link>
                  <span className="text-[9px] tracking-wide text-white/45">
                    No lock-in · Cancel anytime
                  </span>
                </div>
              </div>

              <div className="relative hidden shrink-0 sm:block">
                <div
                  className="absolute -inset-1.5 rounded-xl bg-gradient-to-br from-[#C89B3C]/35 to-[#082F63]/20 blur-sm"
                  aria-hidden
                />
                <div className="relative h-[92px] w-[152px] overflow-hidden rounded-xl ring-1 ring-[#C89B3C]/30 shadow-[0_8px_28px_rgba(0,0,0,0.25)] lg:h-[100px] lg:w-[168px]">
                  <Image
                    src="/images/products/Cow-Milk.png"
                    alt="Fresh farm milk"
                    fill
                    sizes="168px"
                    className="object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#082F63]/70 via-[#082F63]/15 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-l from-transparent to-[#082F63]/25" />
                </div>
              </div>
            </div>
          </MotionReveal>
        </div>
      </div>
    </section>
  );
}
