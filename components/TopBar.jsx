/**
 * TopBar
 * ──────
 * Spec: height 40px, bg #082F63, text 12px white
 * Left : location + phone
 * Center: tagline
 * Right : social circles (28×28, border white/25)
 */
import { FaMapMarkerAlt, FaPhoneAlt, FaFacebookF, FaInstagram, FaWhatsapp } from "react-icons/fa";
import { SITE, SOCIAL_LINKS } from "@/lib/site";
import { CONTAINER } from "@/lib/layout";

const SOCIAL_ICONS = { facebook: FaFacebookF, instagram: FaInstagram, whatsapp: FaWhatsapp };

export default function TopBar() {
  return (
    <div className="bg-[#082F63] text-white">
      <div className={CONTAINER}>
        <div className="h-10 flex items-center justify-between gap-4">

          {/* Left */}
          <div className="flex items-center gap-5">
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(SITE.location)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 text-xs text-white/80 hover:text-white"
            >
              <FaMapMarkerAlt size={11} />
              {SITE.location}
            </a>
            <a
              href={`tel:${SITE.phone.replace(/\s/g, "")}`}
              className="flex items-center gap-1.5 text-xs text-white/80 hover:text-white"
            >
              <FaPhoneAlt size={10} />
              {SITE.phone}
            </a>
          </div>

          {/* Center */}
          <p className="hidden md:block text-xs font-medium text-white/90 tracking-wide">
            {SITE.tagline}
          </p>

          {/* Right — social */}
          <div className="flex items-center gap-2">
            {SOCIAL_LINKS.map(({ label, href, icon }) => {
              const Icon = SOCIAL_ICONS[icon];
              return (
                <a
                  key={icon}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-white/25 text-white/80 hover:text-white hover:bg-white/10"
                >
                  <Icon size={11} />
                </a>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
}
