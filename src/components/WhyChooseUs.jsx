/**
 * Why Choose Us
 * ─────────────
 * Spec:
 *   Padding       : 90px
 *   Grid          : 2 col — left image, right content (lg:grid-cols-[2fr_3fr])
 *   Gap           : 32px → lg:gap-16
 *   Image height  : 460px, radius 20px
 *   H2            : 52px Playfair (section heading size)
 *   Feature grid  : 4 columns, centered
 *   Icon circle   : 80×80px, bg #ECECEC, icon green
 *   Icon size     : 28px
 *   Feature title : 15px 600 navy
 *   Feature desc  : 14px gray-500
 */
import Image from "next/image";
import { FaShieldAlt, FaLeaf, FaTruck } from "react-icons/fa";
import { FaCow } from "react-icons/fa6";
import { WHY_CHOOSE } from "@/utils/site";
import MotionReveal from "@/components/ui/MotionReveal";
import SectionHeading from "@/components/ui/SectionHeading";
import { CONTAINER } from "@/constants/layout";

const ICON_MAP = {
  cow: FaCow,
  shield: FaShieldAlt,
  leaf: FaLeaf,
  truck: FaTruck,
};

export default function WhyChooseUs() {
  return (
    <section id="quality" className="py-[60px] bg-white">
      <div className={CONTAINER}>
        <div className="grid lg:grid-cols-[2fr_3fr] gap-8 lg:gap-16 items-center">
          {/* ── Left — cow image ── */}
          <MotionReveal>
            <div
              className="relative w-full rounded-[20px] overflow-hidden shadow-[0_4px_28px_rgba(8,47,99,0.1)]"
              style={{ height: "460px" }}
            >
              <Image
                src="/images/why-choose-us.png"
                alt="Healthy cows at Shree Shyam Dairy Farm"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 42vw"
              />
            </div>
          </MotionReveal>

          {/* ── Right — content ── */}
          <MotionReveal delay={0.1}>
            <SectionHeading
              align="left"
              label="Why Choose Us"
              title="Hum Quality Se Samjhauta Nahi Karte"
            />

            {/* 4-column feature grid — icon circles 80×80px */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-10 lg:mt-12">
              {WHY_CHOOSE.map((item) => {
                const Icon = ICON_MAP[item.icon];
                return (
                  <div key={item.title} className="flex flex-col items-center text-center">
                    {/* 80×80 icon circle */}
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#ECECEC] text-[#3D8B40]">
                      <Icon size={28} />
                    </div>

                    <h3 className="mt-3.5 text-[14px] sm:text-[15px] font-semibold text-[#082F63] leading-snug">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 text-[13px] sm:text-sm text-gray-500 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </MotionReveal>
        </div>
      </div>
    </section>
  );
}
