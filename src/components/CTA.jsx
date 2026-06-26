/**
 * CTA Banner
 * ───────────
 * Spec:
 *   Bg inside container: #082F63
 *   Radius: 20px
 *   Background image (full bleed, no overlay)
 *   Heading: ~26px Playfair, white
 *   Sub: 16px white/75
 *   Button: white variant, h-12 px-8
 *   Section padding: 4px bottom (flush above footer)
 */
import Image from "next/image";
import MotionReveal from "@/components/ui/MotionReveal";
import OrderButton from "@/components/ui/OrderButton";
import { CONTAINER } from "@/constants/layout";

export default function CTA() {
  return (
    <section aria-label="Call to action" className="bg-white pb-2">
      <div className={CONTAINER}>
        <div className="relative overflow-hidden rounded-[20px] bg-[#082F63]">
          {/* Background image */}
          <Image
            src="/images/shuddh-dooth-seedha-aapke-ghar-tak.png"
            alt=""
            fill
            aria-hidden
            className="object-cover object-center pointer-events-none select-none"
            sizes="(max-width: 1280px) 100vw, 1280px"
          />

          {/* Content overlay */}
          <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center justify-center gap-6 px-6 py-10 sm:px-8 lg:flex-row lg:justify-center lg:gap-10 lg:px-16 lg:py-12">
            <div className="max-w-[650px] text-center lg:text-left">
              <MotionReveal delay={0.08}>
                <h2
                  className="
                      font-heading font-bold text-white leading-snug
                      text-[1.375rem] sm:text-2xl lg:text-[1.625rem]
                  "
                >
                  Shuddh Doodh, Seedha Aapke Ghar Tak
                </h2>
              </MotionReveal>
              <MotionReveal delay={0.22}>
                <p className="mt-2 text-base text-white/75">
                  Aaj hi order karein aur payein tazgi ka vaada har din!
                </p>
              </MotionReveal>
            </div>

            <MotionReveal delay={0.34}>
              <div className="shrink-0">
                <OrderButton href="#contact" variant="white" showArrow={false}>
                  Order Now
                </OrderButton>
              </div>
            </MotionReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
