import Link from "next/link";
import { Milk, Calendar, PauseCircle } from "lucide-react";
import { CONTAINER } from "@/lib/layout";
import MotionReveal from "@/components/ui/MotionReveal";

export default function MilkSubscriptionCTA() {
  return (
    <section className="bg-gradient-to-br from-[#082F63] via-[#0B3D7A] to-[#082F63] py-12 sm:py-16">
      <div className={CONTAINER}>
        <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
          <MotionReveal>
            <div className="flex items-start gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-[#C89B3C] ring-1 ring-white/20">
                <Milk size={28} />
              </span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#C89B3C]">
                  Daily delivery
                </p>
                <h2 className="mt-1 font-heading text-2xl font-bold text-white sm:text-3xl">
                  Subscribe to fresh farm milk
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/75">
                  Doorstep delivery every day — pause, skip, or vacation mode anytime.
                  Auto-pay via Razorpay UPI or card.
                </p>
                <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[12px] text-white/70">
                  <li className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-[#C89B3C]" /> Daily · Weekly · Custom
                  </li>
                  <li className="flex items-center gap-1.5">
                    <PauseCircle size={14} className="text-[#C89B3C]" /> Pause anytime
                  </li>
                </ul>
              </div>
            </div>
          </MotionReveal>

          <MotionReveal delay={0.12}>
            <Link
              href="/login?redirect=/account/subscriptions"
              className="btn-premium-gold inline-flex h-12 items-center justify-center px-8 text-sm font-semibold shadow-lg"
            >
              Subscribe to milk
            </Link>
          </MotionReveal>
        </div>
      </div>
    </section>
  );
}
