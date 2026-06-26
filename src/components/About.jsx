/**
 * About Section
 * ─────────────
 * Spec:
 *   Padding       : 90px (extra top for features bar overlap → pt-[120px])
 *   Grid          : 45% text + 55% image (lg:grid-cols-[45fr_55fr])
 *   Gap           : 32px (gap-8) → lg:gap-16
 *   H2            : 42px (sub-section title size)
 *   Body          : 16px, line-height 1.8, #444
 *   Image height  : 420px
 *   Image radius  : 20px
 *   Button        : h-12 px-8 primary
 */
import Image from "next/image";
import MotionReveal from "@/components/ui/MotionReveal";
// import SectionHeading from "@/components/ui/SectionHeading";
import OrderButton from "@/components/ui/OrderButton";
import { CONTAINER } from "@/constants/layout";

export default function About() {
  return (
    <section id="about" className="bg-white pt-[60px] lg:pt-[60px] pb-[60px]">
      <div className={CONTAINER}>
        <div className="grid lg:grid-cols-[45fr_55fr] gap-8 lg:gap-16 items-center">
          {/* ── Left text ── */}
          <MotionReveal>
            {/* Label */}
            <div className="flex items-center gap-2.5 mb-4">
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#C89B3C]">
                About Us
              </span>
              <span className="h-px w-10 bg-[#C89B3C]/60" />
              <span className="text-[6px] text-[#C89B3C]">◆</span>
            </div>

            {/* H2 — 42px sub-section size */}
            <h2
              className="
              font-heading font-bold text-[#082F63] leading-[1.2]
              text-[1.875rem] sm:text-[2.25rem] lg:text-[2.625rem]
            "
            >
              Shree Shyam Dairy Farm
            </h2>

            {/* Body */}
            <p className="mt-5 text-base text-[#555] leading-[1.8] max-w-[480px]">
              Shree Shyam Dairy Farm ki shurwaat ek sapne ke saath hui — logon tak shuddh, taaza aur
              poshtik dairy products pahunchane ke. Hum apne farm par gaayon ki dekhbhal pure pyaar
              aur vaigyanik tarike se karte hain, taaki aapko mile sabse behtar doodh aur dairy
              products.
            </p>

            <div className="mt-8">
              <OrderButton href="#about" className="text-[15px]">
                Read More
              </OrderButton>
            </div>
          </MotionReveal>

          {/* ── Right image ── */}
          <MotionReveal delay={0.12}>
            <div className="w-full">
              <Image
                src="/images/dairy-form-front-gate.png"
                alt="Shree Shyam Dairy Farm Gate"
                width={900}
                height={650}
                className="w-full h-auto rounded-[20px] shadow-[0_4px_28px_rgba(8,47,99,0.1)]"
              />
            </div>
          </MotionReveal>
        </div>
      </div>
    </section>
  );
}
