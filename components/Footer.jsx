/**
 * Footer
 * ───────
 * Spec:
 *   Bg          : #082F63
 *   Padding top : 80px
 *   Padding bot : 40px
 *   4 col grid  : gap 32px
 *   Logo        : 220px wide area
 *   Col heads   : 14px 600 white uppercase tracking-wide mb-6
 *   Links       : 14px white/60 hover:white
 *   Icons       : h-9 w-9 rounded-full border-white/20
 *   Contact icon: 14px gold
 *   Copyright   : #061E3D bg, 12px white/45, center
 */
"use client";

import {
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaEnvelope,
  FaClock,
  FaChevronRight,
  FaFacebookF,
  FaInstagram,
  FaWhatsapp,
} from "react-icons/fa";
import { SITE, SOCIAL_LINKS, FOOTER_LINKS } from "@/lib/site";
import { CONTAINER } from "@/lib/layout";
import Image from "next/image";
const SOCIAL_ICONS = {
  facebook: FaFacebookF,
  instagram: FaInstagram,
  whatsapp: FaWhatsapp,
};

export default function Footer({ showTagline = true }) {
  const year = new Date().getFullYear();
  return (
    <footer id="contact" className="bg-[#082F63]">
      <div className={`${CONTAINER} pt-20 pb-10`}>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {/* ── Col 1 — Brand (220px logo area) ── */}
          {/* ── Col 1 — Brand ── */}
          <div>
            <div className="flex items-center gap-3">
              <a href="#home" aria-label={SITE.name}>
                <Image
                  src="/logos/logo-footer.png"
                  alt="Logo"
                  width={65}
                  height={65}
                  className="w-[65px] h-[65px]"
                />
              </a>
              <div className="flex flex-col min-w-0">
                <span
                  className={`font-logo font-bold uppercase tracking-[0.12em] leading-[0.95]
      text-[20px] sm:text-[20px] lg:text-[20px] text-white`}
                >
                  SHREE SHYAM
                </span>

                <span
                  className={`font-logo font-bold uppercase tracking-[0.12em] leading-[0.95]
      text-[20px] sm:text-[20px] lg:text-[20px] text-white`}
                >
                  DAIRY FARM
                </span>

                {showTagline && (
                  <span
                    className={`font-tagline mt-1 text-[13px] sm:text-[14px]
        font-small tracking-[0.02em] leading-snug text-white/70`}
                  >
                    {SITE.logoTagline}
                  </span>
                )}
              </div>
            </div>

            <p className="mt-5 text-[14px] text-white/55 leading-[1.75] max-w-[260px]">
              {SITE.footerDesc}
            </p>

            {/* Social */}
            <div className="mt-5 flex items-center gap-2.5">
              {SOCIAL_LINKS.map(({ label, href, icon }) => {
                const Icon = SOCIAL_ICONS[icon];

                return (
                  <a
                    key={icon}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white/65 hover:text-white hover:border-white/45 transition"
                  >
                    <Icon size={13} />
                  </a>
                );
              })}
            </div>
          </div>

          {/* ── Col 2 — Quick Links ── */}
          <div>
            <h4 className="text-[14px] font-semibold uppercase tracking-wide text-white mb-6">
              Quick Links
            </h4>
            <ul className="space-y-3">
              {FOOTER_LINKS.quick.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    className="text-[14px] text-white/60 hover:text-white transition flex items-center gap-1"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Col 3 — Products ── */}
          <div>
            <h4 className="text-[14px] font-semibold uppercase tracking-wide text-white mb-6">
              Our Products
            </h4>
            <ul className="space-y-3">
              {FOOTER_LINKS.products.map((p) => (
                <li key={p.label}>
                  <a
                    href={p.href}
                    className="text-[14px] text-white/60 hover:text-white transition flex items-center gap-2"
                  >
                    <FaChevronRight
                      size={8}
                      className="text-[#C89B3C] shrink-0"
                    />
                    {p.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Col 4 — Contact ── */}
          <div>
            <h4 className="text-[14px] font-semibold uppercase tracking-wide text-white mb-6">
              Contact Us
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-[14px] text-white/65">
                <FaMapMarkerAlt
                  size={14}
                  className="shrink-0 mt-0.5 text-[#C89B3C]"
                />
                <span>{SITE.location}</span>
              </li>
              <li>
                <a
                  href={`tel:${SITE.phone.replace(/\s/g, "")}`}
                  className="flex items-center gap-3 text-[14px] text-white/65 hover:text-white transition"
                >
                  <FaPhoneAlt size={13} className="shrink-0 text-[#C89B3C]" />
                  {SITE.phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${SITE.email}`}
                  className="flex items-start gap-3 text-[14px] text-white/65 hover:text-white transition break-all"
                >
                  <FaEnvelope
                    size={14}
                    className="shrink-0 mt-0.5 text-[#C89B3C]"
                  />
                  {SITE.email}
                </a>
              </li>
              <li className="flex items-start gap-3 text-[14px] text-white/65">
                <FaClock size={14} className="shrink-0 mt-0.5 text-[#C89B3C]" />
                <span>{SITE.hours}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="bg-[#061E3D]">
        <div className="py-4 text-center text-xs text-white/45">
          &copy; {year} {SITE.name}. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
}
