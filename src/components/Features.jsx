/**
 * Feature Strip
 * ─────────────
 * Spec:
 *   Height     : 90px (with py for inner alignment)
 *   Bg         : #082F63
 *   Radius     : 18px
 *   Overlap    : -mt-[56px] lg:-mt-[64px]
 *   4 cols     : equal, dividers
 *   Icon circle: 36×36 bg-white/10, gold icon 16px
 *   Title      : 14px 600 white
 *   Desc       : 12px white/60
 * Icons: custom PNG icons available in /public/icons/
 */
// import Image from "next/image";
import { FEATURES } from "@/utils/site";
import { CONTAINER } from "@/constants/layout";

/* Map icon key → PNG asset */
// const ICON_ASSETS = {
//   leaf:    "/icons/natural-100-icon.png",
//   cow:     "/icons/happy-cows.png",
//   droplet: "/icons/premium-quality-icon.png",
//   home:    "/icons/ghar-tak-icon.png",
// };

/* Fallback SVG icons via react-icons if PNG not desired */
import { FaLeaf, FaTint, FaHome } from "react-icons/fa";
import { FaCow } from "react-icons/fa6";

const SVG_ICONS = {
  leaf: <FaLeaf size={17} />,
  cow: <FaCow size={17} />,
  droplet: <FaTint size={17} />,
  home: <FaHome size={17} />,
};

export default function Features() {
  return (
    <div className="relative z-20 -mt-[60px] sm:-mt-[60px] lg:-mt-[60px]">
      <div className={CONTAINER}>
        <div className="bg-[#082F63] rounded-[18px] shadow-[0_8px_32px_rgba(8,47,99,0.22)]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-white/15">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex items-center gap-4 px-5 lg:px-6 h-[90px]">
                {/* Icon circle */}
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-[#C89B3C]">
                  {SVG_ICONS[f.icon]}
                </span>

                {/* Text */}
                <div>
                  <p className="text-[14px] font-semibold text-white leading-snug">{f.title}</p>
                  <p className="text-[12px] text-white/60 mt-0.5 leading-tight">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
