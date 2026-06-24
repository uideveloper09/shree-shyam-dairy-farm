/**
 * Hero Section
 * ─────────────
 * Spec:
 *   Height        : 720px
 *   H1            : 72px Playfair 700, line-height 1.1, #082F63
 *   Content width : 600px left column
 *   Body text     : 16px Poppins, line-height 1.8
 *   Button        : h-12 px-8, blue, white text, rounded-md
 *   Overlay       : white→transparent (left to right)
 *   Image         : object-cover object-right
 *   Bottom pad    : extra pb for features bar overlap
 */
import Image from "next/image";
import MotionReveal from "@/components/ui/MotionReveal";
import OrderButton from "@/components/ui/OrderButton";
import { CONTAINER } from "@/lib/layout";

export default function Hero() {
  return (
    <section id="home" className="relative w-full overflow-hidden bg-[#edeae3]">

      {/* Background */}
      <Image
        src="/images/hero-section-banner.png"
        alt="Shree Shyam Dairy Farm — Pure Fresh Milk"
        fill
        priority
        className="object-cover object-right"
        sizes="100vw"
      />

      {/* White gradient overlay — left fade */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/55 to-transparent" />

      {/* Content */}
      <div className={`${CONTAINER} relative z-10`}>
        <div className="flex items-center min-h-[720px] pb-20 sm:pb-24">
          <div className="w-full max-w-[600px]">

            {/* H1 — 72px desktop */}
            <MotionReveal delay={0.04}>
              <h1 className="
                font-heading font-bold text-[#082F63] leading-[1.1]
                text-[2.5rem] sm:text-[3.25rem] lg:text-[4rem] xl:text-[4.5rem]
              ">
                Shuddh Doodh,
                <br />
                Sehatmand Zindagi
              </h1>
            </MotionReveal>

            {/* Subtitle — 16px, line-height 1.8 */}
            <MotionReveal delay={0.2}>
              <p className="mt-5 text-[15px] sm:text-base text-[#444] leading-[1.8] max-w-[480px]">
                Pure, Fresh &amp; Natural Dairy Products
                <br className="hidden sm:block" />
                Straight From Our Farm To Your Home.
              </p>
            </MotionReveal>

            {/* CTA */}
            <MotionReveal delay={0.36}>
              <div className="mt-8 sm:mt-10">
                <OrderButton href="#products" className="text-[15px]">
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
